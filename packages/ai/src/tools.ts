import { tool } from 'ai'
import { z } from 'zod'
import {
  applyOp,
  detectCitations,
  formatCsl,
  listAgentBlocks,
  parseDocumentOp,
  searchDocument,
  toAgentView,
  validateOp,
  verifyOpApplied,
  type BlockPatch,
  type CitationStyle,
  type CslJson,
  type DocumentOp,
  type JSONContent,
  type VerificationResult,
} from '@docai/document'

const reasonSchema = z.string().min(1).max(140)

export type PatchPayload = {
  op: DocumentOp
  patches: BlockPatch[]
  affectedBlockIds: string[]
  reason: string
}

export type CitationHooks = {
  style: CitationStyle
  verify: (input: {
    title: string
    authors?: string
    year?: string
    url?: string
    doi?: string
    text?: string
  }) => Promise<VerificationResult>
}

export type WorkingDocument = {
  getDoc: () => JSONContent
  setDoc: (doc: JSONContent) => void
  recordOp: (op: DocumentOp) => void
  emitPatch: (payload: PatchPayload) => void
  readFile: (fileId: string) => Promise<string>
  recordVerifyFailure: (message: string) => void
}

export function applyValidated(
  working: WorkingDocument,
  raw: unknown,
  reason: string,
): string {
  const op = parseDocumentOp(raw)
  const errors = validateOp(working.getDoc(), op)
  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.message).join('; '))
  }
  const result = applyOp(working.getDoc(), op)
  const verifyErrors = verifyOpApplied(result.doc, op, result.affectedBlockIds)
  if (verifyErrors.length > 0) {
    const message = verifyErrors.join('; ')
    working.recordVerifyFailure(message)
    throw new Error(message)
  }
  working.setDoc(result.doc)
  working.recordOp(op)
  working.emitPatch({
    op,
    patches: result.patches,
    affectedBlockIds: result.affectedBlockIds,
    reason,
  })
  return JSON.stringify({
    ok: true,
    affectedBlockIds: result.affectedBlockIds,
    outline: toAgentView(result.doc).slice(0, 4000),
  })
}

function sourceFromCsl(csl: CslJson): {
  title: string
  authors?: string
  year?: string
  url?: string
  publisher?: string
} {
  const authors = csl.author
    ?.map((name) => [name.family, name.given].filter(Boolean).join(', '))
    .filter(Boolean)
    .join(' & ')
  const year = csl.issued?.['date-parts']?.[0]?.[0]
  return {
    title: csl.title ?? 'Untitled',
    authors: authors || undefined,
    year: year ? String(year) : undefined,
    url: csl.DOI ? `https://doi.org/${csl.DOI}` : csl.URL,
    publisher: csl.publisher,
  }
}

export function createDocumentTools(
  working: WorkingDocument,
  writable: boolean,
  citations?: CitationHooks,
) {
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
    checkReferences: tool({
      description:
        'Detect in-text citations and the reference list, match them, and verify each entry against Crossref or OpenAlex. Never invent missing sources.',
      inputSchema: z.object({}),
      execute: async () => {
        const report = detectCitations(working.getDoc())
        if (!citations) {
          return JSON.stringify({ ...report, note: 'Verification is unavailable in this environment.' })
        }
        const verified = await Promise.all(
          report.entries.map(async (entry) => {
            const result = await citations.verify({
              title: entry.title ?? entry.text,
              authors: entry.surname,
              year: entry.year,
              url: entry.url,
              doi: entry.doi,
              text: entry.text,
            })
            return { ...entry, verification: result }
          }),
        )
        return JSON.stringify({
          headingBlockId: report.headingBlockId,
          entries: verified,
          inText: report.inText,
          orphanCitations: report.orphanCitations,
          orphanReferences: report.orphanReferences,
        })
      },
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
        reason: reasonSchema,
      }),
      execute: async ({ reason, ...input }) =>
        applyValidated(working, { type: 'insertBlocks', ...input }, reason),
    }),
    replaceBlocks: tool({
      description: 'Replace one or more existing blocks with markdown.',
      inputSchema: z.object({
        blockIds: z.array(z.string()).min(1),
        markdown: z.string().min(1),
        reason: reasonSchema,
      }),
      execute: async ({ reason, ...input }) =>
        applyValidated(working, { type: 'replaceBlocks', ...input }, reason),
    }),
    deleteBlocks: tool({
      description: 'Delete blocks by id.',
      inputSchema: z.object({
        blockIds: z.array(z.string()).min(1),
        reason: reasonSchema,
      }),
      execute: async ({ reason, ...input }) =>
        applyValidated(working, { type: 'deleteBlocks', ...input }, reason),
    }),
    moveBlocks: tool({
      description: 'Move blocks to sit after afterBlockId. Null afterBlockId moves them to the start.',
      inputSchema: z.object({
        blockIds: z.array(z.string()).min(1),
        afterBlockId: z.string().nullable(),
        reason: reasonSchema,
      }),
      execute: async ({ reason, ...input }) =>
        applyValidated(working, { type: 'moveBlocks', ...input }, reason),
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
        reason: reasonSchema,
      }),
      execute: async ({ reason, ...input }) =>
        applyValidated(working, { type: 'formatBlocks', ...input }, reason),
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
        reason: reasonSchema,
      }),
      execute: async ({ reason, ...input }) =>
        applyValidated(working, { type: 'styleText', ...input }, reason),
    }),
    clearFormatting: tool({
      description: 'Remove marks and paragraph styling from blocks, keeping the wording.',
      inputSchema: z.object({
        blockIds: z.array(z.string()).min(1),
        reason: reasonSchema,
      }),
      execute: async ({ reason, ...input }) =>
        applyValidated(working, { type: 'clearFormatting', ...input }, reason),
    }),
    insertPageBreak: tool({
      description: 'Insert a page break after a block, or at the end if afterBlockId is omitted.',
      inputSchema: z.object({
        afterBlockId: z.string().nullable().optional(),
        reason: reasonSchema,
      }),
      execute: async ({ reason, ...input }) =>
        applyValidated(working, { type: 'insertPageBreak', ...input }, reason),
    }),
    insertTableOfContents: tool({
      description: 'Insert a table of contents block that lists document headings.',
      inputSchema: z.object({
        afterBlockId: z.string().nullable().optional(),
        reason: reasonSchema,
      }),
      execute: async ({ reason, ...input }) =>
        applyValidated(working, { type: 'insertTableOfContents', ...input }, reason),
    }),
    createTable: tool({
      description: 'Insert a table.',
      inputSchema: z.object({
        afterBlockId: z.string().nullable().optional(),
        headers: z.array(z.string()).min(1),
        rows: z.array(z.array(z.string())),
        reason: reasonSchema,
      }),
      execute: async ({ reason, ...input }) =>
        applyValidated(working, { type: 'createTable', ...input }, reason),
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
        reason: reasonSchema,
      }),
      execute: async ({ reason, ...input }) =>
        applyValidated(working, { type: 'updateTableCells', ...input }, reason),
    }),
    createSection: tool({
      description: 'Insert a heading and body markdown as a new section.',
      inputSchema: z.object({
        afterBlockId: z.string().nullable().optional(),
        heading: z.string().min(1),
        level: z.number().int().min(1).max(6).default(1),
        markdown: z.string().default(''),
        reason: reasonSchema,
      }),
      execute: async ({ reason, ...input }) =>
        applyValidated(working, { type: 'createSection', ...input }, reason),
    }),
    addCitation: tool({
      description:
        'Attach a verified citation to a block and add it to References. Refuses if the source cannot be verified.',
      inputSchema: z.object({
        blockId: z.string(),
        source: z.object({
          title: z.string().min(1),
          authors: z.string().optional(),
          year: z.string().optional(),
          url: z.string().optional(),
          publisher: z.string().optional(),
          doi: z.string().optional(),
        }),
        reason: reasonSchema,
      }),
      execute: async ({ reason, blockId, source }) => {
        if (citations) {
          const result = await citations.verify({
            title: source.title,
            authors: source.authors,
            year: source.year,
            url: source.url,
            doi: source.doi,
          })
          if (result.status !== 'verified' || !result.csl) {
            throw new Error(
              'Could not verify this source against Crossref or OpenAlex. Do not invent or silently fix it.',
            )
          }
          const verifiedSource = {
            ...sourceFromCsl(result.csl),
            publisher: source.publisher ?? result.csl.publisher,
          }
          return applyValidated(
            working,
            { type: 'addCitation', blockId, source: verifiedSource },
            reason,
          )
        }
        return applyValidated(working, { type: 'addCitation', blockId, source }, reason)
      },
    }),
    formatReferences: tool({
      description:
        'Reformat verified reference entries to the document citation style. Unverified entries are left unchanged.',
      inputSchema: z.object({
        reason: reasonSchema,
      }),
      execute: async ({ reason }) => {
        const report = detectCitations(working.getDoc())
        if (!citations) {
          throw new Error('Reference formatting needs a citation verifier.')
        }
        const results: string[] = []
        for (const entry of report.entries) {
          const verification = await citations.verify({
            title: entry.title ?? entry.text,
            authors: entry.surname,
            year: entry.year,
            url: entry.url,
            doi: entry.doi,
            text: entry.text,
          })
          if (verification.status !== 'verified' || !verification.csl) {
            results.push(`${entry.blockId}: unverified, left unchanged`)
            continue
          }
          const markdown = formatCsl(verification.csl, citations.style)
          results.push(
            applyValidated(
              working,
              { type: 'replaceBlocks', blockIds: [entry.blockId], markdown },
              reason,
            ),
          )
        }
        return JSON.stringify({ ok: true, results })
      },
    }),
  }
}
