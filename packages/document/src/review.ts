import { nodesToMarkdown } from './markdown.js'
import {
  applyPatches,
  isBlockNotFoundError,
  type BlockPatch,
} from './patches.js'
import { blockId, cloneDoc, findBlockById, topLevelBlocks } from './tree.js'
import type { JSONContent } from './types.js'

export type ProposedChangeKind = 'added' | 'modified' | 'removed' | 'moved'

export type ProposedChange = {
  id: string
  kind: ProposedChangeKind
  blockIds: string[]
  beforeMarkdown: string
  afterMarkdown: string
  anchorBlockId: string | null
  precedingIds: string[]
  reason: string
  nodes: JSONContent[]
}

function sameContent(a: JSONContent, b: JSONContent): boolean {
  const left = { ...a, attrs: omitId(a.attrs) }
  const right = { ...b, attrs: omitId(b.attrs) }
  return JSON.stringify(left) === JSON.stringify(right)
}

function omitId(attrs: JSONContent['attrs']): Record<string, unknown> | undefined {
  if (!attrs) return undefined
  const { id: _id, reviewKind: _reviewKind, ...rest } = attrs
  return rest
}

function markdownOf(nodes: JSONContent[]): string {
  return nodesToMarkdown(nodes).trim()
}

function precedingIdsOf(blocks: JSONContent[], index: number): string[] {
  return blocks
    .slice(0, index)
    .map((block) => blockId(block))
    .filter((id): id is string => Boolean(id))
}

export function attachReasons(
  changes: ProposedChange[],
  reasonsByBlockId: Record<string, string>,
): ProposedChange[] {
  return changes.map((change) => {
    const reason =
      change.blockIds.map((id) => reasonsByBlockId[id]).find(Boolean) ?? change.reason
    return reason && reason !== change.reason ? { ...change, reason } : { ...change, reason }
  })
}

export function diffTopLevelBlocks(
  base: JSONContent,
  proposed: JSONContent,
  reasonsByBlockId: Record<string, string> = {},
): ProposedChange[] {
  const baseBlocks = topLevelBlocks(base)
  const proposedBlocks = topLevelBlocks(proposed)
  const baseById = new Map(
    baseBlocks.flatMap((block) => {
      const id = blockId(block)
      return id ? [[id, block] as const] : []
    }),
  )
  const proposedIds = new Set(
    proposedBlocks.map((block) => blockId(block)).filter((id): id is string => Boolean(id)),
  )
  const baseIndex = new Map(
    baseBlocks.flatMap((block, index) => {
      const id = blockId(block)
      return id ? [[id, index] as const] : []
    }),
  )
  const proposedIndex = new Map(
    proposedBlocks.flatMap((block, index) => {
      const id = blockId(block)
      return id ? [[id, index] as const] : []
    }),
  )

  const changes: ProposedChange[] = []

  proposedBlocks.forEach((block, index) => {
    const id = blockId(block)
    if (!id) return
    const original = baseById.get(id)
    const precedingIds = precedingIdsOf(proposedBlocks, index)
    const anchorBlockId = precedingIds.at(-1) ?? null
    const reason = reasonsByBlockId[id] ?? ''

    if (!original) {
      changes.push({
        id: `added:${id}`,
        kind: 'added',
        blockIds: [id],
        beforeMarkdown: '',
        afterMarkdown: markdownOf([block]),
        anchorBlockId,
        precedingIds,
        reason,
        nodes: [cloneDoc(block)],
      })
      return
    }

    const contentChanged = !sameContent(original, block)
    const moved = baseIndex.get(id) !== proposedIndex.get(id)

    if (contentChanged) {
      changes.push({
        id: `modified:${id}`,
        kind: 'modified',
        blockIds: [id],
        beforeMarkdown: markdownOf([original]),
        afterMarkdown: markdownOf([block]),
        anchorBlockId,
        precedingIds,
        reason,
        nodes: [cloneDoc(block)],
      })
      return
    }

    if (moved) {
      changes.push({
        id: `moved:${id}`,
        kind: 'moved',
        blockIds: [id],
        beforeMarkdown: markdownOf([original]),
        afterMarkdown: markdownOf([block]),
        anchorBlockId,
        precedingIds,
        reason,
        nodes: [cloneDoc(block)],
      })
    }
  })

  baseBlocks.forEach((block, index) => {
    const id = blockId(block)
    if (!id || proposedIds.has(id)) return
    const precedingIds = precedingIdsOf(baseBlocks, index)
    changes.push({
      id: `removed:${id}`,
      kind: 'removed',
      blockIds: [id],
      beforeMarkdown: markdownOf([block]),
      afterMarkdown: '',
      anchorBlockId: precedingIds.at(-1) ?? null,
      precedingIds,
      reason: reasonsByBlockId[id] ?? '',
      nodes: [],
    })
  })

  return changes
}

function resolveAnchor(doc: JSONContent, precedingIds: string[]): string | null {
  for (let index = precedingIds.length - 1; index >= 0; index -= 1) {
    const id = precedingIds[index]
    if (id && findBlockById(doc, id)) return id
  }
  return null
}

function patchForChange(doc: JSONContent, change: ProposedChange): BlockPatch | null {
  switch (change.kind) {
    case 'added': {
      const afterBlockId = resolveAnchor(doc, change.precedingIds)
      return {
        type: 'insert',
        afterBlockId,
        position: afterBlockId ? undefined : change.precedingIds.length === 0 ? 'start' : 'end',
        nodes: change.nodes,
      }
    }
    case 'modified': {
      if (!findBlockById(doc, change.blockIds[0] ?? '')) return null
      return { type: 'replace', blockIds: change.blockIds, nodes: change.nodes }
    }
    case 'removed': {
      if (!findBlockById(doc, change.blockIds[0] ?? '')) return null
      return { type: 'delete', blockIds: change.blockIds }
    }
    case 'moved': {
      if (!findBlockById(doc, change.blockIds[0] ?? '')) return null
      return {
        type: 'move',
        blockIds: change.blockIds,
        afterBlockId: resolveAnchor(doc, change.precedingIds),
      }
    }
    default: {
      const _exhaustive: never = change.kind
      return _exhaustive
    }
  }
}

export function composeAcceptedPatches(
  current: JSONContent,
  changes: ProposedChange[],
  acceptedIds: string[],
): { patches: BlockPatch[]; doc: JSONContent } {
  const accepted = new Set(acceptedIds)
  const patches: BlockPatch[] = []
  let doc = cloneDoc(current)

  for (const change of changes) {
    if (!accepted.has(change.id)) continue
    const patch = patchForChange(doc, change)
    if (!patch) continue
    try {
      doc = applyPatches(doc, [patch])
      patches.push(patch)
    } catch (error) {
      if (!isBlockNotFoundError(error) || change.kind !== 'added') throw error
      const fallback: BlockPatch = {
        type: 'insert',
        afterBlockId: null,
        position: 'end',
        nodes: change.nodes,
      }
      doc = applyPatches(doc, [fallback])
      patches.push(fallback)
    }
  }

  return { patches, doc }
}

export function buildReviewPreviewDoc(
  base: JSONContent,
  proposed: JSONContent,
  changes: ProposedChange[],
): JSONContent {
  const baseBlocks = topLevelBlocks(base)
  const blocks = topLevelBlocks(proposed).map((block) => {
    const id = blockId(block)
    const change = changes.find(
      (item) => item.blockIds.includes(id ?? '') && (item.kind === 'added' || item.kind === 'modified'),
    )
    if (!change) return block
    return {
      ...block,
      attrs: { ...block.attrs, reviewKind: change.kind },
    }
  })

  for (const change of changes) {
    if (change.kind !== 'removed') continue
    const original = findBlockById(base, change.blockIds[0] ?? '')
    if (!original) continue
    const ghost = {
      ...cloneDoc(original),
      attrs: { ...original.attrs, reviewKind: 'removed' },
    }
    const baseIndex = baseBlocks.findIndex((block) => blockId(block) === change.blockIds[0])
    let insertAt = 0
    for (let index = baseIndex - 1; index >= 0; index -= 1) {
      const previousId = blockId(baseBlocks[index]!)
      const found = blocks.findIndex((block) => blockId(block) === previousId)
      if (found !== -1) {
        insertAt = found + 1
        break
      }
    }
    blocks.splice(insertAt, 0, ghost)
  }

  return { type: 'doc', content: blocks }
}
