import type { Editor } from '@tiptap/react'
import {
  applyPatches,
  type BlockPatch,
  type JSONContent,
} from '@docai/document'
import type * as Y from 'yjs'

export type IncomingPatchPayload = {
  patches: BlockPatch[]
  affectedBlockIds?: string[]
}

function isPatchPayload(raw: unknown): raw is IncomingPatchPayload {
  return Boolean(raw && typeof raw === 'object' && Array.isArray((raw as IncomingPatchPayload).patches))
}

export function applyIncomingPatch(editor: Editor, raw: unknown, undoManager?: Y.UndoManager) {
  if (!isPatchPayload(raw)) {
    throw new Error('Invalid patch payload')
  }
  const current = editor.getJSON() as JSONContent
  const next = applyPatches(current, raw.patches)
  undoManager?.stopCapturing()
  editor.commands.setContent(next, false)
  highlightBlocks(editor, raw.affectedBlockIds ?? [])
  return raw.affectedBlockIds ?? []
}

export function topLevelBlockIds(doc: JSONContent): string[] {
  return (doc.content ?? []).map((block) =>
    typeof block.attrs?.id === 'string' ? block.attrs.id : '',
  )
}

export function shouldReconcile(current: JSONContent, finalDoc: JSONContent): boolean {
  return JSON.stringify(topLevelBlockIds(current)) !== JSON.stringify(topLevelBlockIds(finalDoc))
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
