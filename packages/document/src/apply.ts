import { createBlockId } from './ids.js'
import { markdownToNodes } from './markdown.js'
import type { DocumentOp } from './ops.js'
import {
  assignMissingIds,
  blockId,
  cloneDoc,
  findBlockIndex,
  paragraph,
  setTopLevelBlocks,
  tableNode,
  textOf,
  topLevelBlocks,
  heading,
} from './tree.js'
import type { JSONContent } from './types.js'

export type ApplyResult = {
  doc: JSONContent
  affectedBlockIds: string[]
}

function insertAt(
  blocks: JSONContent[],
  newBlocks: JSONContent[],
  afterBlockId?: string | null,
  position?: 'start' | 'end',
): JSONContent[] {
  if (position === 'start') {
    return [...newBlocks, ...blocks]
  }
  if (!afterBlockId || position === 'end') {
    return [...blocks, ...newBlocks]
  }
  const index = findBlockIndex(blocks, afterBlockId)
  if (index === -1) {
    throw new Error(`Block ${afterBlockId} was not found`)
  }
  return [...blocks.slice(0, index + 1), ...newBlocks, ...blocks.slice(index + 1)]
}

function idsOf(nodes: JSONContent[]): string[] {
  return nodes.map((node) => blockId(node)).filter((id): id is string => Boolean(id))
}

function applyOne(doc: JSONContent, op: DocumentOp): ApplyResult {
  const blocks = topLevelBlocks(doc)

  switch (op.type) {
    case 'insertBlocks': {
      const nodes = markdownToNodes(op.markdown).map(assignMissingIds)
      return {
        doc: setTopLevelBlocks(doc, insertAt(blocks, nodes, op.afterBlockId, op.position)),
        affectedBlockIds: idsOf(nodes),
      }
    }
    case 'replaceBlocks': {
      const firstIndex = findBlockIndex(blocks, op.blockIds[0] ?? '')
      if (firstIndex === -1) {
        throw new Error(`Block ${op.blockIds[0]} was not found`)
      }
      const nodes = markdownToNodes(op.markdown).map(assignMissingIds)
      const remaining = blocks.filter((block) => {
        const id = blockId(block)
        return !id || !op.blockIds.includes(id)
      })
      const insertIndex = Math.min(
        firstIndex,
        remaining.length === 0 ? 0 : remaining.length,
      )
      const next = [...remaining]
      const originalRemainingBefore = blocks
        .slice(0, firstIndex)
        .filter((block) => {
          const id = blockId(block)
          return !id || !op.blockIds.includes(id)
        }).length
      next.splice(originalRemainingBefore, 0, ...nodes)
      void insertIndex
      return {
        doc: setTopLevelBlocks(doc, next),
        affectedBlockIds: idsOf(nodes),
      }
    }
    case 'deleteBlocks': {
      return {
        doc: setTopLevelBlocks(
          doc,
          blocks.filter((block) => {
            const id = blockId(block)
            return !id || !op.blockIds.includes(id)
          }),
        ),
        affectedBlockIds: op.blockIds,
      }
    }
    case 'moveBlocks': {
      const moving = blocks.filter((block) => {
        const id = blockId(block)
        return id && op.blockIds.includes(id)
      })
      const remaining = blocks.filter((block) => {
        const id = blockId(block)
        return !id || !op.blockIds.includes(id)
      })
      return {
        doc: setTopLevelBlocks(
          doc,
          insertAt(remaining, moving, op.afterBlockId),
        ),
        affectedBlockIds: op.blockIds,
      }
    }
    case 'formatBlocks': {
      const next = blocks.map((block) => {
        const id = blockId(block)
        if (!id || !op.blockIds.includes(id)) return block
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
        return formatted
      })
      return { doc: setTopLevelBlocks(doc, next), affectedBlockIds: op.blockIds }
    }
    case 'createTable': {
      const table = tableNode(op.headers, op.rows)
      return {
        doc: setTopLevelBlocks(
          doc,
          insertAt(blocks, [table], op.afterBlockId),
        ),
        affectedBlockIds: idsOf([table]),
      }
    }
    case 'updateTableCells': {
      const next = blocks.map((block) => {
        if (blockId(block) !== op.tableId) return block
        const rows = [...(block.content ?? [])]
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
        return { ...block, content: rows }
      })
      return {
        doc: setTopLevelBlocks(doc, next),
        affectedBlockIds: [op.tableId],
      }
    }
    case 'createSection': {
      const headingNode = heading(op.heading, op.level)
      const body = op.markdown.trim()
        ? markdownToNodes(op.markdown).map(assignMissingIds)
        : [paragraph('')]
      const nodes = [headingNode, ...body]
      return {
        doc: setTopLevelBlocks(
          doc,
          insertAt(blocks, nodes, op.afterBlockId),
        ),
        affectedBlockIds: idsOf(nodes),
      }
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
      const next = blocks.map((block) => {
        if (blockId(block) !== op.blockId) return block
        const content = [...(block.content ?? [])]
        content.push({
          type: 'text',
          text: ` [${citationId}]`,
          marks: [
            {
              type: 'citation',
              attrs: { citationId, title: op.source.title },
            },
          ],
        })
        return { ...block, content }
      })
      const referencesHeading = next.find(
        (block) =>
          block.type === 'heading' &&
          textOf(block).toLowerCase() === 'references',
      )
      const referenceLine = paragraph(
        `[${citationId}] ${sourceLabel}${op.source.url ? `. ${op.source.url}` : ''}`,
      )
      if (referencesHeading) {
        const headingIndex = next.indexOf(referencesHeading)
        next.splice(headingIndex + 1, 0, referenceLine)
      } else {
        next.push(heading('References', 1), referenceLine)
      }
      return {
        doc: setTopLevelBlocks(doc, next),
        affectedBlockIds: [op.blockId, ...(blockId(referenceLine) ? [blockId(referenceLine)!] : [])],
      }
    }
  }
}

export function applyOp(doc: JSONContent, op: DocumentOp): ApplyResult {
  return applyOne(cloneDoc(doc), op)
}

export function applyOps(
  doc: JSONContent,
  ops: DocumentOp[],
): { doc: JSONContent; affectedBlockIds: string[] } {
  let current = cloneDoc(doc)
  const affected = new Set<string>()
  for (const op of ops) {
    const result = applyOne(current, op)
    current = result.doc
    for (const id of result.affectedBlockIds) affected.add(id)
  }
  return { doc: current, affectedBlockIds: [...affected] }
}
