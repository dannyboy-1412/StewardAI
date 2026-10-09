import { generateText, streamText, stepCountIs, tool, type LanguageModel } from 'ai'
import { z } from 'zod'
import { toAgentView, type DocumentOp, type JSONContent } from '@docai/document'
import { ASK_AGENT_SYSTEM, DOCUMENT_AGENT_SYSTEM, buildUserPrompt } from './prompts.js'
import { applyValidated, createDocumentTools, type WorkingDocument } from './tools.js'

export type AgentFile = { id: string; filename: string }

export type AgentWriter = {
  write: (part: { type: `data-${string}`; data: unknown }) => void
}

export type RunDocumentAgentInput = {
  instruction: string
  document: JSONContent
  selectionBlockIds: string[]
  files: AgentFile[]
  mode: 'edit' | 'ask'
  model: LanguageModel
  fastModel?: LanguageModel
  readFile: (fileId: string) => Promise<string>
  abortSignal?: AbortSignal
  writer?: AgentWriter
}

export function runDocumentAgent(input: RunDocumentAgentInput) {
  let doc: JSONContent = input.document
  const ops: DocumentOp[] = []

  const working: WorkingDocument = {
    getDoc: () => doc,
    setDoc: (next) => {
      doc = next
    },
    recordOp: (op) => {
      ops.push(op)
    },
    emitPatch: (payload) => {
      input.writer?.write({ type: 'data-patch', data: payload })
    },
    readFile: input.readFile,
  }

  const writable = input.mode === 'edit'
  const documentTools = createDocumentTools(working, writable)

  const writeSectionTool = tool({
          description:
            'Generate a long section then insert heading + body. Use this for multi-hundred-word sections instead of stuffing a huge markdown string into createSection.',
          inputSchema: z.object({
            afterBlockId: z.string().nullable().optional(),
            heading: z.string().min(1),
            level: z.number().int().min(1).max(6).default(1),
            brief: z.string().min(1),
            targetWords: z.number().int().min(80).max(1200).default(350),
          }),
          execute: async ({ afterBlockId, heading, level, brief, targetWords }) => {
            const markdown = await generateText({
              model: input.fastModel ?? input.model,
              abortSignal: input.abortSignal,
              prompt: `Write the document section "${heading}".
Brief: ${brief}
Target length: about ${targetWords} words.
Return markdown only. Do not include the heading itself.`,
            })
            return applyValidated(working, {
              type: 'createSection',
              afterBlockId,
              heading,
              level,
              markdown: markdown.text,
            })
          },
  })

  const result = streamText({
    model: input.model,
    abortSignal: input.abortSignal,
    stopWhen: stepCountIs(24),
    system: writable ? DOCUMENT_AGENT_SYSTEM : ASK_AGENT_SYSTEM,
    prompt: buildUserPrompt({
      instruction: input.instruction,
      documentView: toAgentView(doc),
      selectionBlockIds: input.selectionBlockIds,
      fileSummaries: input.files,
    }),
    tools: writable
      ? { ...documentTools, writeSection: writeSectionTool }
      : documentTools,
  })

  return {
    result,
    getDoc: () => doc,
    getOps: () => ops,
  }
}
