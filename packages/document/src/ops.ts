import { z } from 'zod'

export const insertBlocksOpSchema = z.object({
  type: z.literal('insertBlocks'),
  afterBlockId: z.string().nullable().optional(),
  position: z.enum(['start', 'end']).optional(),
  markdown: z.string().min(1),
})

export const replaceBlocksOpSchema = z.object({
  type: z.literal('replaceBlocks'),
  blockIds: z.array(z.string()).min(1),
  markdown: z.string().min(1),
})

export const deleteBlocksOpSchema = z.object({
  type: z.literal('deleteBlocks'),
  blockIds: z.array(z.string()).min(1),
})

export const moveBlocksOpSchema = z.object({
  type: z.literal('moveBlocks'),
  blockIds: z.array(z.string()).min(1),
  afterBlockId: z.string().nullable(),
})

export const formatBlocksOpSchema = z.object({
  type: z.literal('formatBlocks'),
  blockIds: z.array(z.string()).min(1),
  blockType: z
    .enum(['paragraph', 'heading', 'blockquote', 'codeBlock'])
    .optional(),
  headingLevel: z.number().int().min(1).max(6).optional(),
  alignment: z.enum(['left', 'center', 'right', 'justify']).optional(),
  styleName: z.enum(['title', 'subtitle']).nullable().optional(),
  lineHeight: z.string().min(1).optional(),
  spaceBefore: z.number().optional(),
  spaceAfter: z.number().optional(),
  indent: z.number().int().min(0).max(8).optional(),
})

export const styleTextOpSchema = z.object({
  type: z.literal('styleText'),
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
})

export const clearFormattingOpSchema = z.object({
  type: z.literal('clearFormatting'),
  blockIds: z.array(z.string()).min(1),
})

export const insertPageBreakOpSchema = z.object({
  type: z.literal('insertPageBreak'),
  afterBlockId: z.string().nullable().optional(),
})

export const insertTableOfContentsOpSchema = z.object({
  type: z.literal('insertTableOfContents'),
  afterBlockId: z.string().nullable().optional(),
})

export const createTableOpSchema = z.object({
  type: z.literal('createTable'),
  afterBlockId: z.string().nullable().optional(),
  headers: z.array(z.string()).min(1),
  rows: z.array(z.array(z.string())),
})

export const updateTableCellsOpSchema = z.object({
  type: z.literal('updateTableCells'),
  tableId: z.string(),
  cells: z.array(
    z.object({
      row: z.number().int().min(0),
      col: z.number().int().min(0),
      text: z.string(),
    }),
  ),
})

export const createSectionOpSchema = z.object({
  type: z.literal('createSection'),
  afterBlockId: z.string().nullable().optional(),
  heading: z.string().min(1),
  level: z.number().int().min(1).max(6).default(1),
  markdown: z.string().default(''),
})

export const addCitationOpSchema = z.object({
  type: z.literal('addCitation'),
  blockId: z.string(),
  source: z.object({
    title: z.string().min(1),
    authors: z.string().optional(),
    year: z.string().optional(),
    url: z.string().optional(),
    publisher: z.string().optional(),
  }),
})

export const documentOpSchema = z.discriminatedUnion('type', [
  insertBlocksOpSchema,
  replaceBlocksOpSchema,
  deleteBlocksOpSchema,
  moveBlocksOpSchema,
  formatBlocksOpSchema,
  styleTextOpSchema,
  clearFormattingOpSchema,
  insertPageBreakOpSchema,
  insertTableOfContentsOpSchema,
  createTableOpSchema,
  updateTableCellsOpSchema,
  createSectionOpSchema,
  addCitationOpSchema,
])

export type InsertBlocksOp = z.infer<typeof insertBlocksOpSchema>
export type ReplaceBlocksOp = z.infer<typeof replaceBlocksOpSchema>
export type DeleteBlocksOp = z.infer<typeof deleteBlocksOpSchema>
export type MoveBlocksOp = z.infer<typeof moveBlocksOpSchema>
export type FormatBlocksOp = z.infer<typeof formatBlocksOpSchema>
export type StyleTextOp = z.infer<typeof styleTextOpSchema>
export type ClearFormattingOp = z.infer<typeof clearFormattingOpSchema>
export type InsertPageBreakOp = z.infer<typeof insertPageBreakOpSchema>
export type InsertTableOfContentsOp = z.infer<typeof insertTableOfContentsOpSchema>
export type CreateTableOp = z.infer<typeof createTableOpSchema>
export type UpdateTableCellsOp = z.infer<typeof updateTableCellsOpSchema>
export type CreateSectionOp = z.infer<typeof createSectionOpSchema>
export type AddCitationOp = z.infer<typeof addCitationOpSchema>
export type DocumentOp = z.infer<typeof documentOpSchema>
