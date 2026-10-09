import { tool } from 'ai'
import { z } from 'zod'
import {
  applyOp,
  listAgentBlocks,
  parseDocumentOp,
  searchDocument,
  toAgentView,
  validateOp,
  type BlockPatch,
  type DocumentOp,
  type JSONContent,
} from '@docai/document'

export type PatchPayload = {
  op: DocumentOp
  patches: BlockPatch[]
  affectedBlockIds: string[]
}

export type WorkingDocument = {
  getDoc: () => JSONContent
  setDoc: (doc: JSONContent) => void
  recordOp: (op: DocumentOp) => void
  emitPatch: (payload: PatchPayload) => void
  readFile: (fileId: string) => Promise<string>
}

export function applyValidated(working: WorkingDocument, raw: unknown): string {
  const op = parseDocumentOp(raw)
  const errors = validateOp(working.getDoc(), op)
  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.message).join('; '))
  }
  const result = applyOp(working.getDoc(), op)
  working.setDoc(result.doc)
  working.recordOp(op)
  working.emitPatch({
    op,
    patches: result.patches,
    affectedBlockIds: result.affectedBlockIds,
  })
  return JSON.stringify({
    ok: true,
    affectedBlockIds: result.affectedBlockIds,
    outline: toAgentView(result.doc).slice(0, 4000),
  })
}

export function createDocumentTools(working: WorkingDocument, writable: boolean) {
  const readTools = {
    getOutline: tool({
      description: 'Get the document outline and every block id with its markdown.',
      inputSchema: z.object({}),
      execute: async () => toAgentView(working.getDoc()),
    }),
    readBlocks: tool({
      description: 'Read specific blocks by id.',
      inputSchema: z.object({
        blockIds: z.array(z.string()).min(1),
      }),
      execute: async ({ blockIds }) => {
        const blocks = listAgentBlocks(working.getDoc()).filter((block) =>
          blockIds.includes(block.id),
        )
        return JSON.stringify(blocks)
      },
    }),
    searchDocument: tool({
      description: 'Search block text for a query.',
      inputSchema: z.object({ query: z.string().min(1) }),
      execute: async ({ query }) => JSON.stringify(searchDocument(working.getDoc(), query)),
    }),
    readFile: tool({
      description: 'Read extracted text from an attached file by file id.',
      inputSchema: z.object({ fileId: z.string().min(1) }),
      execute: async ({ fileId }) => working.readFile(fileId),
    }),
  }

  if (!writable) return readTools

  return {
    ...readTools,
    insertBlocks: tool({
      description: 'Insert markdown blocks after a block id, or at start/end.',
      inputSchema: z.object({
        afterBlockId: z.string().nullable().optional(),
        position: z.enum(['start', 'end']).optional(),
        markdown: z.string().min(1),
      }),
      execute: async (input) => applyValidated(working, { type: 'insertBlocks', ...input }),
    }),
    replaceBlocks: tool({
      description: 'Replace one or more existing blocks with markdown.',
      inputSchema: z.object({
        blockIds: z.array(z.string()).min(1),
        markdown: z.string().min(1),
      }),
      execute: async (input) => applyValidated(working, { type: 'replaceBlocks', ...input }),
    }),
    deleteBlocks: tool({
      description: 'Delete blocks by id.',
      inputSchema: z.object({
        blockIds: z.array(z.string()).min(1),
      }),
      execute: async (input) => applyValidated(working, { type: 'deleteBlocks', ...input }),
    }),
    moveBlocks: tool({
      description: 'Move blocks to sit after afterBlockId. Null afterBlockId moves them to the start.',
      inputSchema: z.object({
        blockIds: z.array(z.string()).min(1),
        afterBlockId: z.string().nullable(),
      }),
      execute: async (input) => applyValidated(working, { type: 'moveBlocks', ...input }),
    }),
    formatBlocks: tool({
      description:
        'Change block type, heading level, alignment, paragraph style, line height, spacing, or indent. Use this instead of replaceBlocks when wording should stay the same.',
      inputSchema: z.object({
        blockIds: z.array(z.string()).min(1),
        blockType: z.enum(['paragraph', 'heading', 'blockquote', 'codeBlock']).optional(),
        headingLevel: z.number().int().min(1).max(6).optional(),
        alignment: z.enum(['left', 'center', 'right', 'justify']).optional(),
        styleName: z.enum(['title', 'subtitle']).nullable().optional(),
        lineHeight: z.string().min(1).optional(),
        spaceBefore: z.number().optional(),
        spaceAfter: z.number().optional(),
        indent: z.number().int().min(0).max(8).optional(),
      }),
      execute: async (input) => applyValidated(working, { type: 'formatBlocks', ...input }),
    }),
    styleText: tool({
      description:
        'Apply font, size, color, highlight, or emphasis to text in blocks. Optionally target an exact substring with match.',
      inputSchema: z.object({
        blockIds: z.array(z.string()).min(1),
        match: z.string().min(1).optional(),
        fontFamily: z.string().min(1).optional(),
        fontSize: z.string().min(1).optional(),
        color: z.string().min(1).optional(),
        highlight: z.string().min(1).optional(),
        bold: z.boolean().optional(),
        italic: z.boolean().optional(),
        underline: z.boolean().optional(),
        strike: z.boolean().optional(),
        subscript: z.boolean().optional(),
        superscript: z.boolean().optional(),
      }),
      execute: async (input) => applyValidated(working, { type: 'styleText', ...input }),
    }),
    clearFormatting: tool({
      description: 'Remove marks and paragraph styling from blocks, keeping the wording.',
      inputSchema: z.object({
        blockIds: z.array(z.string()).min(1),
      }),
      execute: async (input) => applyValidated(working, { type: 'clearFormatting', ...input }),
    }),
    insertPageBreak: tool({
      description: 'Insert a page break after a block, or at the end if afterBlockId is omitted.',
      inputSchema: z.object({
        afterBlockId: z.string().nullable().optional(),
      }),
      execute: async (input) => applyValidated(working, { type: 'insertPageBreak', ...input }),
    }),
    insertTableOfContents: tool({
      description: 'Insert a table of contents block that lists document headings.',
      inputSchema: z.object({
        afterBlockId: z.string().nullable().optional(),
      }),
      execute: async (input) => applyValidated(working, { type: 'insertTableOfContents', ...input }),
    }),
    createTable: tool({
      description: 'Insert a table.',
      inputSchema: z.object({
        afterBlockId: z.string().nullable().optional(),
        headers: z.array(z.string()).min(1),
        rows: z.array(z.array(z.string())),
      }),
      execute: async (input) => applyValidated(working, { type: 'createTable', ...input }),
    }),
    updateTableCells: tool({
      description: 'Update cells in an existing table. Row 0 is the header.',
      inputSchema: z.object({
        tableId: z.string(),
        cells: z.array(
          z.object({
            row: z.number().int().min(0),
            col: z.number().int().min(0),
            text: z.string(),
          }),
        ),
      }),
      execute: async (input) => applyValidated(working, { type: 'updateTableCells', ...input }),
    }),
    createSection: tool({
      description: 'Insert a heading and body markdown as a new section.',
      inputSchema: z.object({
        afterBlockId: z.string().nullable().optional(),
        heading: z.string().min(1),
        level: z.number().int().min(1).max(6).default(1),
        markdown: z.string().default(''),
      }),
      execute: async (input) => applyValidated(working, { type: 'createSection', ...input }),
    }),
    addCitation: tool({
      description: 'Attach a citation to a block and add it to References.',
      inputSchema: z.object({
        blockId: z.string(),
        source: z.object({
          title: z.string().min(1),
          authors: z.string().optional(),
          year: z.string().optional(),
          url: z.string().optional(),
          publisher: z.string().optional(),
        }),
      }),
      execute: async (input) => applyValidated(working, { type: 'addCitation', ...input }),
    }),
  }
}
