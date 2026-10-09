import type { StyleTextOp } from './ops.js'
import type { JSONContent, JSONMark } from './types.js'

const BLOCK_ATTR_KEYS = [
  'textAlign',
  'lineHeight',
  'spaceBefore',
  'spaceAfter',
  'indent',
  'styleName',
] as const

function mergeTextStyle(
  marks: JSONMark[] | undefined,
  patch: Record<string, unknown>,
): JSONMark[] {
  const current = marks ?? []
  const existing = current.find((mark) => mark.type === 'textStyle')
  const others = current.filter((mark) => mark.type !== 'textStyle')
  const attrs: Record<string, unknown> = { ...existing?.attrs }
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) delete attrs[key]
    else if (value !== undefined) attrs[key] = value
  }
  const hasAny = Object.values(attrs).some((value) => value != null && value !== '')
  return hasAny ? [...others, { type: 'textStyle', attrs }] : others
}

function setToggleMark(marks: JSONMark[] | undefined, type: string, enabled?: boolean): JSONMark[] {
  const current = marks ?? []
  const without = current.filter((mark) => mark.type !== type)
  if (enabled === undefined) return current
  if (!enabled) return without
  return [...without, { type }]
}

function setHighlight(marks: JSONMark[] | undefined, color?: string): JSONMark[] {
  if (color === undefined) return marks ?? []
  const without = (marks ?? []).filter((mark) => mark.type !== 'highlight')
  if (!color) return without
  return [...without, { type: 'highlight', attrs: { color } }]
}

function applyMarksToNode(node: JSONContent, op: StyleTextOp): JSONContent {
  let marks = node.marks ?? []
  const textStylePatch: Record<string, unknown> = {}
  if (op.fontFamily !== undefined) textStylePatch.fontFamily = op.fontFamily
  if (op.fontSize !== undefined) textStylePatch.fontSize = op.fontSize
  if (op.color !== undefined) textStylePatch.color = op.color
  if (Object.keys(textStylePatch).length > 0) {
    marks = mergeTextStyle(marks, textStylePatch)
  }
  marks = setHighlight(marks, op.highlight)
  marks = setToggleMark(marks, 'bold', op.bold)
  marks = setToggleMark(marks, 'italic', op.italic)
  marks = setToggleMark(marks, 'underline', op.underline)
  marks = setToggleMark(marks, 'strike', op.strike)
  if (op.subscript !== undefined || op.superscript !== undefined) {
    marks = marks.filter((mark) => mark.type !== 'subscript' && mark.type !== 'superscript')
    if (op.subscript) marks = [...marks, { type: 'subscript' }]
    if (op.superscript) marks = [...marks, { type: 'superscript' }]
  }
  return { ...node, marks: marks.length > 0 ? marks : undefined }
}

function splitAndStyle(node: JSONContent, match: string, op: StyleTextOp): JSONContent[] {
  const text = node.text ?? ''
  const parts: JSONContent[] = []
  let remaining = text
  while (remaining.length > 0) {
    const index = remaining.indexOf(match)
    if (index === -1) {
      parts.push({ type: 'text', text: remaining, marks: node.marks })
      break
    }
    if (index > 0) {
      parts.push({ type: 'text', text: remaining.slice(0, index), marks: node.marks })
    }
    parts.push(applyMarksToNode({ type: 'text', text: match, marks: node.marks }, op))
    remaining = remaining.slice(index + match.length)
  }
  return parts.length > 0 ? parts : [node]
}

function mapTextNodes(
  nodes: JSONContent[] | undefined,
  transform: (node: JSONContent) => JSONContent[],
): JSONContent[] | undefined {
  if (!nodes) return nodes
  const output: JSONContent[] = []
  for (const node of nodes) {
    if (node.text !== undefined) {
      output.push(...transform(node))
    } else {
      output.push({ ...node, content: mapTextNodes(node.content, transform) })
    }
  }
  return output
}

export function applyStyleText(block: JSONContent, op: StyleTextOp): JSONContent {
  return {
    ...block,
    content: mapTextNodes(block.content, (node) => {
      if (op.match && node.text && node.text.includes(op.match)) {
        return splitAndStyle(node, op.match, op)
      }
      if (op.match) return [node]
      return [applyMarksToNode(node, op)]
    }),
  }
}

export function stripMarks(node: JSONContent): JSONContent {
  const next: JSONContent = { ...node }
  if (next.marks) delete next.marks
  if (next.content) next.content = next.content.map(stripMarks)
  return next
}

export function clearBlockFormatting(block: JSONContent): JSONContent {
  const attrs: Record<string, unknown> = {}
  if (typeof block.attrs?.id === 'string') attrs.id = block.attrs.id
  if (block.attrs?.level !== undefined) attrs.level = block.attrs.level
  if (block.attrs?.checked !== undefined) attrs.checked = block.attrs.checked
  if (block.attrs?.language !== undefined) attrs.language = block.attrs.language
  return stripMarks({ ...block, attrs })
}

export function copyBlockLayout(from: JSONContent, to: JSONContent): JSONContent {
  const attrs = { ...to.attrs }
  for (const key of BLOCK_ATTR_KEYS) {
    if (from.attrs?.[key] !== undefined) attrs[key] = from.attrs[key]
  }
  return { ...to, attrs }
}

function firstTextMarks(node: JSONContent): JSONMark[] | undefined {
  if (node.marks && node.text) return node.marks
  for (const child of node.content ?? []) {
    const marks = firstTextMarks(child)
    if (marks) return marks
  }
  return undefined
}

export function blockStyleSummary(block: JSONContent): string {
  const parts: string[] = []
  const align = block.attrs?.textAlign
  if (typeof align === 'string') parts.push(`align:${align}`)
  const lineHeight = block.attrs?.lineHeight
  if (typeof lineHeight === 'string') parts.push(`lineHeight:${lineHeight}`)
  const indent = block.attrs?.indent
  if (typeof indent === 'number' && indent > 0) parts.push(`indent:${indent}`)
  const styleName = block.attrs?.styleName
  if (typeof styleName === 'string') parts.push(`style:${styleName}`)
  const marks = firstTextMarks(block)
  const textStyle = marks?.find((mark) => mark.type === 'textStyle')?.attrs
  const family = typeof textStyle?.fontFamily === 'string' ? textStyle.fontFamily : undefined
  const size = typeof textStyle?.fontSize === 'string' ? textStyle.fontSize : undefined
  if (family || size) parts.push(`font:${[family, size].filter(Boolean).join(' ')}`)
  const color = typeof textStyle?.color === 'string' ? textStyle.color : undefined
  if (color) parts.push(`color:${color}`)
  return parts.length > 0 ? ` {${parts.join(', ')}}` : ''
}
