import type { Editor } from '@tiptap/react'
import { applyOp, parseDocumentOp, type JSONContent } from '@docai/document'
import type * as Y from 'yjs'

export function applyIncomingOp(editor: Editor, raw: unknown, undoManager?: Y.UndoManager) {
  const op = parseDocumentOp(raw)
  const current = editor.getJSON() as JSONContent
  const result = applyOp(current, op)
  undoManager?.stopCapturing()
  editor.commands.setContent(result.doc, false)
  highlightBlocks(editor, result.affectedBlockIds)
  return result.affectedBlockIds
}

function highlightBlocks(editor: Editor, ids: string[]) {
  const view = editor.view
  ids.forEach((id) => {
    const el = view.dom.querySelector(`[data-id="${id}"], [id="${id}"]`)
    if (el instanceof HTMLElement) {
      el.classList.add('is-ai-highlight')
      window.setTimeout(() => el.classList.remove('is-ai-highlight'), 2400)
    }
  })
}
