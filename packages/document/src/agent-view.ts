import { nodesToMarkdown } from './markdown.js'
import { blockId, textOf, topLevelBlocks } from './tree.js'
import type { JSONContent } from './types.js'

export type AgentBlockView = {
  id: string
  type: string
  markdown: string
}

export function toAgentView(doc: JSONContent): string {
  const blocks = topLevelBlocks(doc)
  const outline = blocks
    .filter((block) => block.type === 'heading')
    .map((block) => {
      const id = blockId(block) ?? 'unknown'
      const level = Number(block.attrs?.level ?? 1)
      return `${'  '.repeat(level - 1)}- [${id}] ${textOf(block)}`
    })
    .join('\n')

  const body = blocks
    .map((block) => {
      const id = blockId(block) ?? 'unknown'
      const markdown = nodesToMarkdown([block])
      return `[${id}] ${block.type}\n${markdown}`
    })
    .join('\n\n')

  return `## Outline\n${outline || '(empty)'}\n\n## Blocks\n${body}`
}

export function listAgentBlocks(doc: JSONContent): AgentBlockView[] {
  return topLevelBlocks(doc).map((block) => ({
    id: blockId(block) ?? 'unknown',
    type: block.type,
    markdown: nodesToMarkdown([block]),
  }))
}

export function searchDocument(doc: JSONContent, query: string): AgentBlockView[] {
  const needle = query.toLowerCase()
  return listAgentBlocks(doc).filter(
    (block) =>
      block.markdown.toLowerCase().includes(needle) ||
      block.type.toLowerCase().includes(needle),
  )
}
