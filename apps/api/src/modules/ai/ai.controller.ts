import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import {
  createUIMessageStream,
  generateText,
  pipeUIMessageStreamToResponse,
} from 'ai'
import {
  acknowledgementBodySchema,
  aiRunBodySchema,
  aiRunReviewBodySchema,
  STREAM_EVENT,
} from '@docai/shared'
import {
  diffTopLevelBlocks,
  type JSONContent,
} from '@docai/document'
import {
  buildAcknowledgement,
  runDocumentAgent,
  TOOL_ATTRIBUTION,
  type PatchPayload,
} from '@docai/ai'
import { CurrentUser, type CurrentUserRecord } from '../../auth/current-user.js'
import { ModelProvider } from '../../infrastructure/ai/model.provider.js'
import { DocumentsService } from '../documents/documents.service.js'
import { verifyReference } from '../citations/reference-verifier.js'
import { exportDocument, isExportFormat } from '../documents/export/export-document.js'
import { aiLogAppendix } from './log-appendix.js'

@Controller('documents/:id/ai')
export class AiController {
  constructor(
    @Inject(DocumentsService) private readonly documents: DocumentsService,
    @Inject(ModelProvider) private readonly models: ModelProvider,
  ) {}

  @Get('runs')
  list(@CurrentUser() user: CurrentUserRecord, @Param('id', ParseUUIDPipe) id: string) {
    return this.documents.listAiRuns(user.id, id)
  }

  @Patch('runs/:runId/review')
  review(
    @CurrentUser() user: CurrentUserRecord,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('runId', ParseUUIDPipe) runId: string,
    @Body() body: unknown,
  ) {
    const input = aiRunReviewBodySchema.parse(body)
    return this.documents.reviewAiRun(user.id, id, runId, {
      outcome: input.outcome,
      acceptedChangeIds: input.acceptedChangeIds,
      changes: input.changes,
    })
  }

  @Get('log')
  async log(@CurrentUser() user: CurrentUserRecord, @Param('id', ParseUUIDPipe) id: string) {
    const runs = await this.documents.listAiRuns(user.id, id)
    return { contentJson: aiLogAppendix(runs) }
  }

  @Get('log/export')
  async exportLog(
    @CurrentUser() user: CurrentUserRecord,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('format') format = 'docx',
  ) {
    if (format !== 'docx' && format !== 'md') {
      throw new BadRequestException('Export format must be docx or md')
    }
    if (!isExportFormat(format)) {
      throw new BadRequestException('Unsupported export format')
    }
    const doc = await this.documents.get(user.id, id)
    const runs = await this.documents.listAiRuns(user.id, id)
    const file = await exportDocument({
      title: `${doc.title} AI use log`,
      contentJson: aiLogAppendix(runs),
      pageSettings: doc.pageSettings,
      format,
    })
    return new StreamableFile(file.body, {
      type: file.mime,
      disposition: `attachment; filename="${file.filename.replace(/["\\\r\n]/g, '_')}"`,
    })
  }

  @Post('acknowledgement')
  async acknowledgement(
    @CurrentUser() user: CurrentUserRecord,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    const input = acknowledgementBodySchema.parse(body ?? {})
    const runs = await this.documents.listAiRuns(user.id, id)
    let usageSummary = input.usageSummary?.trim() ?? ''
    if (!usageSummary && process.env.OPENROUTER_API_KEY && runs.length > 0) {
      try {
        const { fastModel } = this.models.getModels()
        const generated = await generateText({
          model: fastModel,
          prompt: `In one or two sentences, describe how this student used an AI writing assistant on a university assignment. Do not invent extra tools. Prompts:\n${runs.map((run) => `- ${run.prompt}`).join('\n')}`,
        })
        usageSummary = generated.text.trim()
      } catch {
        usageSummary = ''
      }
    }
    const statement = buildAcknowledgement({
      format: input.format,
      runs: runs.map((run) => ({
        prompt: run.prompt,
        createdAt: run.createdAt,
        model: run.model,
      })),
      usageSummary,
    })
    return {
      statement,
      tool: TOOL_ATTRIBUTION,
    }
  }

  @Post('runs')
  async run(
    @CurrentUser() user: CurrentUserRecord,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const input = aiRunBodySchema.parse(body)
    const doc = await this.documents.get(user.id, id)
    await this.documents.saveVersion(id, {
      contentJson: doc.contentJson,
      ydocState: doc.ydocState,
      source: 'ai',
      label: 'Before AI run',
    })

    const modelId = process.env.OPENROUTER_MODEL ?? 'openrouter'
    const run = await this.documents.createAiRun({
      documentId: id,
      userId: user.id,
      prompt: input.instruction,
      model: modelId,
      mode: input.mode,
    })

    const attached = await Promise.all(
      input.fileIds.map(async (fileId) => {
        const file = await this.documents.getFile(user.id, fileId)
        return { id: file.id, filename: file.filename, extractedText: file.extractedText }
      }),
    )

    const snapshot = (input.snapshot as JSONContent | undefined) ?? doc.contentJson
    const abort = new AbortController()
    req.on('close', () => abort.abort())
    const reasonsByBlockId: Record<string, string> = {}

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        writer.write({ type: STREAM_EVENT.runStarted, data: { runId: run.id } })
        const heartbeat = setInterval(() => {
          writer.write({ type: STREAM_EVENT.heartbeat, data: { t: Date.now() } })
        }, 20_000)
        try {
          if (!process.env.OPENROUTER_API_KEY) {
            const { applyOp } = await import('@docai/document')
            const markdown =
              input.mode === 'ask'
                ? ''
                : `## AI draft\n\n${input.instruction}\n\nThis local demo applied a document operation without an OpenRouter key.`
            if (input.mode === 'edit') {
              const op = {
                type: 'insertBlocks' as const,
                position: 'end' as const,
                markdown,
              }
              const next = applyOp(snapshot, op)
              const reason = 'Demo draft inserted at the end of the document.'
              for (const blockId of next.affectedBlockIds) reasonsByBlockId[blockId] = reason
              writer.write({
                type: STREAM_EVENT.patch,
                data: {
                  op,
                  patches: next.patches,
                  affectedBlockIds: next.affectedBlockIds,
                  reason,
                },
              })
              const changes = diffTopLevelBlocks(snapshot, next.doc, reasonsByBlockId)
              await this.documents.finishAiRun(run.id, {
                status: 'completed',
                ops: [op],
                responseText: 'Applied a demo edit. Set OPENROUTER_API_KEY for the full agent.',
                changes,
                reviewStatus: 'pending',
              })
              writer.write({
                type: 'text-delta',
                id: 'demo',
                delta: 'Applied a demo edit. Set OPENROUTER_API_KEY for the full agent.',
              })
              writer.write({
                type: STREAM_EVENT.runSummary,
                data: { runId: run.id, opCount: 1, failedChecks: [] },
              })
              writer.write({
                type: STREAM_EVENT.runFinished,
                data: { runId: run.id, demo: true, doc: next.doc, changes },
              })
            } else {
              await this.documents.finishAiRun(run.id, {
                status: 'completed',
                ops: [],
                responseText: 'Connect OPENROUTER_API_KEY to ask questions about the document.',
                reviewStatus: null,
              })
              writer.write({
                type: 'text-delta',
                id: 'demo',
                delta: 'Connect OPENROUTER_API_KEY to ask questions about the document.',
              })
              writer.write({
                type: STREAM_EVENT.runSummary,
                data: { runId: run.id, opCount: 0, failedChecks: [] },
              })
              writer.write({
                type: STREAM_EVENT.runFinished,
                data: { runId: run.id, demo: true, doc: snapshot },
              })
            }
            return
          }
          const { model, fastModel } = this.models.getModels()
          const agent = runDocumentAgent({
            instruction: input.instruction,
            document: snapshot,
            selectionBlockIds: input.selectionBlockIds,
            files: attached.map(({ id: fileId, filename }) => ({ id: fileId, filename })),
            mode: input.mode,
            model,
            fastModel,
            abortSignal: abort.signal,
            writer: {
              write: (part) => {
                if (part.type === 'data-patch') {
                  const payload = part.data as PatchPayload
                  for (const blockId of payload.affectedBlockIds) {
                    if (payload.reason) reasonsByBlockId[blockId] = payload.reason
                  }
                }
                writer.write(part)
              },
            },
            citations: {
              style: doc.citationStyle,
              verify: (source) => verifyReference(source),
            },
            readFile: async (fileId) => {
              const file = attached.find((item) => item.id === fileId)
              if (file?.extractedText) return file.extractedText
              const stored = await this.documents.getFile(user.id, fileId)
              return stored.extractedText ?? `[No extracted text for ${stored.filename}]`
            },
          })
          writer.merge(agent.result.toUIMessageStream())
          const responseText = await agent.result.text
          const proposed = agent.getDoc()
          const changes = diffTopLevelBlocks(snapshot, proposed, reasonsByBlockId)
          const opCount = agent.getOps().length
          const failedChecks = agent.getVerifyFailures()
          await this.documents.finishAiRun(run.id, {
            status: abort.signal.aborted ? 'cancelled' : 'completed',
            ops: agent.getOps(),
            responseText,
            changes,
            reviewStatus: input.mode === 'ask' || opCount === 0 ? null : 'pending',
          })
          writer.write({
            type: STREAM_EVENT.runSummary,
            data: { runId: run.id, opCount, failedChecks },
          })
          writer.write({
            type: STREAM_EVENT.runFinished,
            data: { runId: run.id, opCount, doc: proposed, changes },
          })
        } catch (error) {
          await this.documents.finishAiRun(run.id, {
            status: 'failed',
            error: error instanceof Error ? error.message : 'AI run failed',
          })
          throw error
        } finally {
          clearInterval(heartbeat)
        }
      },
    })

    pipeUIMessageStreamToResponse({
      response: res,
      stream,
      keepAliveMs: 15_000,
    })
  }
}
