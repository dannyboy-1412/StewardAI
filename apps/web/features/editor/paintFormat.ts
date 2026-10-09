import type { Editor } from '@tiptap/react'

export type PaintSnapshot = {
  marks: Array<{ type: string; attrs?: Record<string, unknown> }>
  textAlign?: string
  lineHeight?: string
  indent?: number | null
}

export function copyPaintFormat(editor: Editor): PaintSnapshot {
  const marks = editor.state.selection.$from.marks().map((mark) => ({
    type: mark.type.name,
    attrs: mark.attrs as Record<string, unknown>,
  }))
  const paragraph = editor.getAttributes('paragraph')
  const heading = editor.getAttributes('heading')
  const attrs = editor.isActive('heading') ? heading : paragraph
  return {
    marks,
    textAlign: typeof attrs.textAlign === 'string' ? attrs.textAlign : undefined,
    lineHeight: typeof attrs.lineHeight === 'string' ? attrs.lineHeight : undefined,
    indent: typeof attrs.indent === 'number' ? attrs.indent : null,
  }
}

export function applyPaintFormat(editor: Editor, snapshot: PaintSnapshot) {
  let chain = editor.chain().focus().unsetAllMarks()
  for (const mark of snapshot.marks) {
    chain = chain.setMark(mark.type, mark.attrs)
  }
  if (snapshot.textAlign) chain = chain.setTextAlign(snapshot.textAlign)
  if (snapshot.lineHeight) chain = chain.setLineHeight(snapshot.lineHeight)
  if (snapshot.indent != null) chain = chain.setIndent(snapshot.indent)
  chain.run()
}
