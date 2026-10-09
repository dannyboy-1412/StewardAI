import { createBlockId } from './ids.js'
import { markdownToNodes } from './markdown.js'
import type { DocumentOp } from './ops.js'
import {
  affectedIdsFromPatches,
  applyPatches,
  type BlockPatch,
} from './patches.js'
import {
  applyStyleText,
  clearBlockFormatting,
  copyBlockLayout,
} from './style-text.js'
import {
  assignMissingIds,
  blockId,
  cloneDoc,
  findBlockById,
  findBlockIndex,
  paragraph,
  tableNode,
  textOf,
  topLevelBlocks,
  heading,
} from './tree.js'
import type { JSONContent } from './types.js'

export type ApplyResult = {
  doc: JSONContent
  affectedBlockIds: string[]
  patches: BlockPatch[]
}

function atomNode(type: 'pageBreak' | 'tableOfContents'): JSONContent {
  return { type, attrs: { id: createBlockId() } }
}

function insertPatch(
  nodes: JSONContent[],
  afterBlockId?: string | null,
  position?: 'start' | 'end',
): BlockPatch {
  return {
    type: 'insert',
    afterBlockId: afterBlockId ?? null,
    position,
    nodes,
  }
}

export function resolveOp(doc: JSONContent, op: DocumentOp): BlockPatch[] {
  const blocks = topLevelBlocks(doc)

  switch (op.type) {
    case 'insertBlocks':
      return [
        insertPatch(
          markdownToNodes(op.markdown).map(assignMissingIds),
          op.afterBlockId,
          op.position,
        ),
      ]
    case 'replaceBlocks': {
      const firstIndex = findBlockIndex(blocks, op.blockIds[0] ?? '')
      const original = firstIndex === -1 ? undefined : blocks[firstIndex]
      let nodes = markdownToNodes(op.markdown).map(assignMissingIds)
      if (original && op.blockIds.length === 1 && nodes.length === 1 && nodes[0]?.type === original.type) {
        nodes = [copyBlockLayout(original, nodes[0])]
      }
      return [{ type: 'replace', blockIds: op.blockIds, nodes }]
    }
    case 'deleteBlocks':
      return [{ type: 'delete', blockIds: op.blockIds }]
    case 'moveBlocks':
      return [{ type: 'move', blockIds: op.blockIds, afterBlockId: op.afterBlockId }]
    case 'formatBlocks': {
      const updated = blocks.flatMap((block) => {
        const id = blockId(block)
        if (!id || !op.blockIds.includes(id)) return []
        const formatted: JSONContent = { ...block }
        if (op.blockType) {
          formatted.type = op.blockType
        }
        formatted.attrs = { ...block.attrs }
        if (op.headingLevel !== undefined) {
          formatted.attrs.level = op.headingLevel
          if (!op.blockType) formatted.type = 'heading'
        }
        if (op.alignment) {
          formatted.attrs.textAlign = op.alignment
        }
        if (op.styleName !== undefined) {
          formatted.attrs.styleName = op.styleName
          if (op.styleName && !op.blockType) formatted.type = 'paragraph'
        }
        if (op.lineHeight !== undefined) {
          formatted.attrs.lineHeight = op.lineHeight
        }
        if (op.spaceBefore !== undefined) {
          formatted.attrs.spaceBefore = op.spaceBefore
        }
        if (op.spaceAfter !== undefined) {
          formatted.attrs.spaceAfter = op.spaceAfter
        }
        if (op.indent !== undefined) {
          formatted.attrs.indent = op.indent
        }
        return [formatted]
      })
      return updated.length > 0 ? [{ type: 'update', blocks: updated }] : []
    }
    case 'styleText': {
      const updated = blocks.flatMap((block) => {
        const id = blockId(block)
        if (!id || !op.blockIds.includes(id)) return []
        return [applyStyleText(block, op)]
      })
      return updated.length > 0 ? [{ type: 'update', blocks: updated }] : []
    }
    case 'clearFormatting': {
      const updated = blocks.flatMap((block) => {
        const id = blockId(block)
        if (!id || !op.blockIds.includes(id)) return []
        return [clearBlockFormatting(block)]
      })
      return updated.length > 0 ? [{ type: 'update', blocks: updated }] : []
    }
    case 'insertPageBreak':
      return [insertPatch([atomNode('pageBreak')], op.afterBlockId)]
    case 'insertTableOfContents':
      return [insertPatch([atomNode('tableOfContents')], op.afterBlockId)]
    case 'createTable':
      return [insertPatch([tableNode(op.headers, op.rows)], op.afterBlockId)]
    case 'updateTableCells': {
      const table = findBlockById(doc, op.tableId)
      if (!table) return []
      const rows = [...(table.content ?? [])]
      for (const update of op.cells) {
        const row = rows[update.row]
        if (!row?.content) continue
        const cells = [...row.content]
        const existing = cells[update.col]
        if (!existing) continue
        cells[update.col] = {
          ...existing,
          content: [paragraph(update.text)],
        }
        rows[update.row] = { ...row, content: cells }
      }
      return [{ type: 'update', blocks: [{ ...table, content: rows }] }]
    }
    case 'createSection': {
      const headingNode = heading(op.heading, op.level)
      const body = op.markdown.trim()
        ? markdownToNodes(op.markdown).map(assignMissingIds)
        : [paragraph('')]
      return [insertPatch([headingNode, ...body], op.afterBlockId)]
    }
    case 'addCitation': {
      const citationId = createBlockId()
      const sourceLabel = [
        op.source.authors,
        op.source.year ? `(${op.source.year})` : undefined,
        op.source.title,
      ]
        .filter(Boolean)
        .join(' ')
      const patches: BlockPatch[] = []
      const target = findBlockById(doc, op.blockId)
      if (target) {
        patches.push({
          type: 'update',
          blocks: [
            {
              ...target,
              content: [
                ...(target.content ?? []),
                {
                  type: 'text',
                  text: ` [${citationId}]`,
                  marks: [
                    {
                      type: 'citation',
                      attrs: { citationId, title: op.source.title },
                    },
                  ],
                },
              ],
            },
          ],
        })
      }
      const referenceLine = paragraph(
        `[${citationId}] ${sourceLabel}${op.source.url ? `. ${op.source.url}` : ''}`,
      )
      const referencesHeading = blocks.find(
        (block) =>
          block.type === 'heading' &&
          textOf(block).toLowerCase() === 'references',
      )
      if (referencesHeading) {
        patches.push(insertPatch([referenceLine], blockId(referencesHeading) ?? null))
      } else {
        patches.push(insertPatch([heading('References', 1), referenceLine], null, 'end'))
      }
      return patches
    }
    default: {
      const _exhaustive: never = op
      return _exhaustive
    }
  }
}

export function applyOp(doc: JSONContent, op: DocumentOp): ApplyResult {
  const patches = resolveOp(doc, op)
  return {
    doc: applyPatches(doc, patches),
    affectedBlockIds: affectedIdsFromPatches(patches),
    patches,
  }
}

export function applyOps(
  doc: JSONContent,
  ops: DocumentOp[],
): { doc: JSONContent; affectedBlockIds: string[] } {
  let current = cloneDoc(doc)
  const affected = new Set<string>()
  for (const op of ops) {
    const result = applyOp(current, op)
    current = result.doc
    for (const id of result.affectedBlockIds) affected.add(id)
  }
  return { doc: current, affectedBlockIds: [...affected] }
}
