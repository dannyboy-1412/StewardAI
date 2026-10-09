import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Post, Req, Res } from '@nestjs/common'
import type { Request, Response } from 'express'
import {
  createUIMessageStream,
  pipeUIMessageStreamToResponse,
} from 'ai'
import { aiRunBodySchema, STREAM_EVENT } from '@docai/shared'
import type { JSONContent } from '@docai/document'
import { runDocumentAgent } from '@docai/ai'
import { CurrentUser, type CurrentUserRecord } from '../../auth/current-user.js'
import { ModelProvider } from '../../infrastructure/ai/model.provider.js'
import { DocumentsService } from '../documents/documents.service.js'

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

    const run = await this.documents.createAiRun({
      documentId: id,
      userId: user.id,
      prompt: input.instruction,
      model: process.env.OPENROUTER_MODEL ?? 'openrouter',
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
              writer.write({
                type: STREAM_EVENT.patch,
                data: {
                  op,
                  patches: next.patches,
                  affectedBlockIds: next.affectedBlockIds,
                },
              })
              await this.documents.finishAiRun(run.id, { status: 'completed', ops: [op] })
              writer.write({
                type: 'text-delta',
                id: 'demo',
                delta: 'Applied a demo edit. Set OPENROUTER_API_KEY for the full agent.',
              })
              writer.write({
                type: STREAM_EVENT.runFinished,
                data: { runId: run.id, demo: true, doc: next.doc },
              })
            } else {
              await this.documents.finishAiRun(run.id, { status: 'completed', ops: [] })
              writer.write({
                type: 'text-delta',
                id: 'demo',
                delta: 'Connect OPENROUTER_API_KEY to ask questions about the document.',
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
              write: (part) => writer.write(part),
            },
            readFile: async (fileId) => {
              const file = attached.find((item) => item.id === fileId)
              if (file?.extractedText) return file.extractedText
              const stored = await this.documents.getFile(user.id, fileId)
              return stored.extractedText ?? `[No extracted text for ${stored.filename}]`
            },
          })
          writer.merge(agent.result.toUIMessageStream())
          await agent.result.text
          await this.documents.finishAiRun(run.id, {
            status: abort.signal.aborted ? 'cancelled' : 'completed',
            ops: agent.getOps(),
          })
          writer.write({
            type: STREAM_EVENT.runFinished,
            data: { runId: run.id, opCount: agent.getOps().length, doc: agent.getDoc() },
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
