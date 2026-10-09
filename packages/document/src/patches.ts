import {
  blockId,
  cloneDoc,
  findBlockIndex,
  setTopLevelBlocks,
  topLevelBlocks,
} from './tree.js'
import type { JSONContent } from './types.js'

export type BlockPatch =
  | {
      type: 'insert'
      afterBlockId: string | null
      position?: 'start' | 'end'
      nodes: JSONContent[]
    }
  | { type: 'replace'; blockIds: string[]; nodes: JSONContent[] }
  | { type: 'delete'; blockIds: string[] }
  | { type: 'move'; blockIds: string[]; afterBlockId: string | null }
  | { type: 'update'; blocks: JSONContent[] }

export class BlockNotFoundError extends Error {
  readonly blockId: string

  constructor(blockId: string) {
    super(`Block ${blockId} was not found`)
    this.name = 'BlockNotFoundError'
    this.blockId = blockId
  }
}

export function isBlockNotFoundError(error: unknown): error is BlockNotFoundError {
  return (
    error instanceof BlockNotFoundError ||
    (error instanceof Error && error.name === 'BlockNotFoundError')
  )
}

function cloneNodes(nodes: JSONContent[]): JSONContent[] {
  return structuredClone(nodes)
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
    throw new BlockNotFoundError(afterBlockId)
  }
  return [...blocks.slice(0, index + 1), ...newBlocks, ...blocks.slice(index + 1)]
}

function idsOf(nodes: JSONContent[]): string[] {
  return nodes.map((node) => blockId(node)).filter((id): id is string => Boolean(id))
}

export function affectedIdsFromPatches(patches: BlockPatch[]): string[] {
  const ids: string[] = []
  for (const patch of patches) {
    switch (patch.type) {
      case 'insert':
      case 'replace':
        ids.push(...idsOf(patch.nodes))
        break
      case 'delete':
      case 'move':
        ids.push(...patch.blockIds)
        break
      case 'update':
        ids.push(...idsOf(patch.blocks))
        break
    }
  }
  return ids
}

function applyOnePatch(doc: JSONContent, patch: BlockPatch): JSONContent {
  const blocks = topLevelBlocks(doc)

  switch (patch.type) {
    case 'insert':
      return setTopLevelBlocks(
        doc,
        insertAt(blocks, cloneNodes(patch.nodes), patch.afterBlockId, patch.position),
      )
    case 'replace': {
      const firstIndex = findBlockIndex(blocks, patch.blockIds[0] ?? '')
      if (firstIndex === -1) {
        throw new BlockNotFoundError(patch.blockIds[0] ?? '')
      }
      const remaining = blocks.filter((block) => {
        const id = blockId(block)
        return !id || !patch.blockIds.includes(id)
      })
      const originalRemainingBefore = blocks
        .slice(0, firstIndex)
        .filter((block) => {
          const id = blockId(block)
          return !id || !patch.blockIds.includes(id)
        }).length
      const next = [...remaining]
      next.splice(originalRemainingBefore, 0, ...cloneNodes(patch.nodes))
      return setTopLevelBlocks(doc, next)
    }
    case 'delete':
      return setTopLevelBlocks(
        doc,
        blocks.filter((block) => {
          const id = blockId(block)
          return !id || !patch.blockIds.includes(id)
        }),
      )
    case 'move': {
      const moving = blocks.filter((block) => {
        const id = blockId(block)
        return id && patch.blockIds.includes(id)
      })
      const remaining = blocks.filter((block) => {
        const id = blockId(block)
        return !id || !patch.blockIds.includes(id)
      })
      return setTopLevelBlocks(doc, insertAt(remaining, moving, patch.afterBlockId))
    }
    case 'update': {
      const missing = patch.blocks.find((block) => {
        const id = blockId(block)
        return !id || findBlockIndex(blocks, id) === -1
      })
      if (missing) {
        throw new BlockNotFoundError(blockId(missing) ?? '')
      }
      const byId = new Map(
        patch.blocks.flatMap((block) => {
          const id = blockId(block)
          return id ? [[id, block] as const] : []
        }),
      )
      return setTopLevelBlocks(
        doc,
        blocks.map((block) => {
          const id = blockId(block)
          if (!id || !byId.has(id)) return block
          return structuredClone(byId.get(id)!)
        }),
      )
    }
    default: {
      const _exhaustive: never = patch
      return _exhaustive
    }
  }
}

export function applyPatches(doc: JSONContent, patches: BlockPatch[]): JSONContent {
  let current = cloneDoc(doc)
  for (const patch of patches) {
    current = applyOnePatch(current, patch)
  }
  return current
}
