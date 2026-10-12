import type { DocumentOp } from './ops.js'
import { blockStyleSummary } from './style-text.js'
import { findBlockById, topLevelBlocks } from './tree.js'
import type { JSONContent } from './types.js'

export function verifyOpApplied(
  doc: JSONContent,
  op: DocumentOp,
  affectedBlockIds: string[],
): string[] {
  const errors: string[] = []

  switch (op.type) {
    case 'formatBlocks':
      for (const id of op.blockIds) {
        const block = findBlockById(doc, id)
        if (!block) {
          errors.push(`Block ${id} was not found after formatting`)
          continue
        }
        if (op.blockType && block.type !== op.blockType) {
          errors.push(`Block ${id} type is ${block.type}, expected ${op.blockType}`)
        }
        if (op.headingLevel !== undefined && Number(block.attrs?.level) !== op.headingLevel) {
          errors.push(`Block ${id} heading level was not set to ${op.headingLevel}`)
        }
        if (op.alignment && block.attrs?.textAlign !== op.alignment) {
          errors.push(`Block ${id} alignment was not set to ${op.alignment}`)
        }
        if (op.styleName !== undefined && (block.attrs?.styleName ?? null) !== op.styleName) {
          errors.push(`Block ${id} style was not set to ${op.styleName}`)
        }
        if (op.lineHeight !== undefined && block.attrs?.lineHeight !== op.lineHeight) {
          errors.push(`Block ${id} line height was not set to ${op.lineHeight}`)
        }
        if (op.indent !== undefined && block.attrs?.indent !== op.indent) {
          errors.push(`Block ${id} indent was not set to ${op.indent}`)
        }
      }
      break
    case 'styleText':
      for (const id of op.blockIds) {
        const block = findBlockById(doc, id)
        if (!block) {
          errors.push(`Block ${id} was not found after styling`)
          continue
        }
        const summary = blockStyleSummary(block)
        if (op.fontFamily && !summary.includes(op.fontFamily)) {
          errors.push(`Block ${id} font family was not set to ${op.fontFamily}`)
        }
        if (op.fontSize && !summary.includes(op.fontSize)) {
          errors.push(`Block ${id} font size was not set to ${op.fontSize}`)
        }
        if (op.color && !summary.includes(op.color)) {
          errors.push(`Block ${id} color was not set to ${op.color}`)
        }
      }
      break
    case 'createTable':
      if (!affectedBlockIds.some((id) => findBlockById(doc, id)?.type === 'table')) {
        errors.push('Table was not created')
      }
      break
    case 'insertTableOfContents':
      if (!topLevelBlocks(doc).some((block) => block.type === 'tableOfContents')) {
        errors.push('Table of contents was not inserted')
      }
      break
    case 'insertPageBreak':
      if (!topLevelBlocks(doc).some((block) => block.type === 'pageBreak')) {
        errors.push('Page break was not inserted')
      }
      break
    default:
      break
  }

  return errors
}
