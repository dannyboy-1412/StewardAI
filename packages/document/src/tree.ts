import { BLOCK_TYPES_WITH_ID, type JSONContent } from './types.js'

export type { JSONContent } from './types.js'
import { createBlockId } from './ids.js'

export function emptyDoc(): JSONContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        attrs: { id: createBlockId() },
      },
    ],
  }
}

export function cloneDoc(doc: JSONContent): JSONContent {
  return structuredClone(doc)
}

export function ensureDoc(doc: unknown): JSONContent {
  if (!doc || typeof doc !== 'object' || !('type' in doc)) {
    return emptyDoc()
  }
  const record = doc as JSONContent
  if (record.type !== 'doc') {
    return emptyDoc()
  }
  if (!record.content || record.content.length === 0) {
    return emptyDoc()
  }
  return record
}

export function topLevelBlocks(doc: JSONContent): JSONContent[] {
  return doc.content ?? []
}

export function setTopLevelBlocks(doc: JSONContent, blocks: JSONContent[]): JSONContent {
  return { ...doc, content: blocks }
}

export function blockId(node: JSONContent): string | undefined {
  const id = node.attrs?.id
  return typeof id === 'string' ? id : undefined
}

export function findBlockIndex(blocks: JSONContent[], id: string): number {
  return blocks.findIndex((block) => blockId(block) === id)
}

export function findBlockById(doc: JSONContent, id: string): JSONContent | undefined {
  return topLevelBlocks(doc).find((block) => blockId(block) === id)
}

export function collectBlockIds(doc: JSONContent): Set<string> {
  const ids = new Set<string>()
  for (const block of topLevelBlocks(doc)) {
    const id = blockId(block)
    if (id) ids.add(id)
  }
  return ids
}

export function assignMissingIds(node: JSONContent): JSONContent {
  const next: JSONContent = { ...node }
  if (BLOCK_TYPES_WITH_ID.includes(node.type) && !blockId(node)) {
    next.attrs = { ...node.attrs, id: createBlockId() }
  }
  if (node.content) {
    next.content = node.content.map(assignMissingIds)
  }
  return next
}

export function textOf(node: JSONContent): string {
  if (node.text) return node.text
  if (!node.content) return ''
  return node.content.map(textOf).join('')
}

export function paragraph(text: string, extraAttrs: Record<string, unknown> = {}): JSONContent {
  return {
    type: 'paragraph',
    attrs: { id: createBlockId(), ...extraAttrs },
    content: text ? [{ type: 'text', text }] : undefined,
  }
}

export function heading(
  text: string,
  level: number,
  extraAttrs: Record<string, unknown> = {},
): JSONContent {
  return {
    type: 'heading',
    attrs: { id: createBlockId(), level, ...extraAttrs },
    content: text ? [{ type: 'text', text }] : undefined,
  }
}

export function cell(text: string, type: 'tableHeader' | 'tableCell' = 'tableCell'): JSONContent {
  return {
    type,
    content: [paragraph(text)],
  }
}

export function tableNode(headers: string[], rows: string[][]): JSONContent {
  const headerRow: JSONContent = {
    type: 'tableRow',
    content: headers.map((header) => cell(header, 'tableHeader')),
  }
  const bodyRows: JSONContent[] = rows.map((row) => ({
    type: 'tableRow',
    content: headers.map((_, index) => cell(row[index] ?? '')),
  }))
  return {
    type: 'table',
    attrs: { id: createBlockId() },
    content: [headerRow, ...bodyRows],
  }
}
