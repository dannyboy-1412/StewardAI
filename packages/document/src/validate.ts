import { documentOpSchema, type DocumentOp } from './ops.js'
import { collectBlockIds, findBlockById } from './tree.js'
import type { JSONContent } from './types.js'

export type ValidationError = {
  message: string
}

export function parseDocumentOp(input: unknown): DocumentOp {
  return documentOpSchema.parse(input)
}

export function validateOp(doc: JSONContent, op: DocumentOp): ValidationError[] {
  const ids = collectBlockIds(doc)
  const errors: ValidationError[] = []
  const requireId = (id: string) => {
    if (!ids.has(id)) errors.push({ message: `Unknown block id: ${id}` })
  }

  switch (op.type) {
    case 'insertBlocks':
      if (op.afterBlockId) requireId(op.afterBlockId)
      break
    case 'replaceBlocks':
    case 'deleteBlocks':
    case 'formatBlocks':
      for (const id of op.blockIds) requireId(id)
      break
    case 'moveBlocks':
      for (const id of op.blockIds) requireId(id)
      if (op.afterBlockId) requireId(op.afterBlockId)
      if (op.afterBlockId && op.blockIds.includes(op.afterBlockId)) {
        errors.push({ message: 'Cannot move blocks after a block that is also being moved' })
      }
      break
    case 'createTable':
      if (op.afterBlockId) requireId(op.afterBlockId)
      break
    case 'updateTableCells': {
      requireId(op.tableId)
      const table = findBlockById(doc, op.tableId)
      if (table && table.type !== 'table') {
        errors.push({ message: `Block ${op.tableId} is not a table` })
      }
      break
    }
    case 'createSection':
      if (op.afterBlockId) requireId(op.afterBlockId)
      break
    case 'addCitation':
      requireId(op.blockId)
      break
  }

  return errors
}
