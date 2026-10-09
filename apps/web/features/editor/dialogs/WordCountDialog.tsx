'use client'

import type { Editor } from '@tiptap/react'
import { DialogShell } from '../ui'

export function WordCountDialog({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const characters = editor.storage.characterCount?.characters() ?? editor.getText().length
  const words = editor.storage.characterCount?.words() ?? editor.getText().split(/\s+/).filter(Boolean).length
  const selected = editor.state.doc.textBetween(
    editor.state.selection.from,
    editor.state.selection.to,
    ' ',
  )
  const selectedWords = selected.trim() ? selected.trim().split(/\s+/).length : 0

  return (
    <DialogShell title="Word count" onClose={onClose} width="w-[min(320px,calc(100vw-2rem))]">
      <dl className="grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-muted">Words</dt>
        <dd className="text-right text-forest">{words}</dd>
        <dt className="text-muted">Characters</dt>
        <dd className="text-right text-forest">{characters}</dd>
        <dt className="text-muted">Selected words</dt>
        <dd className="text-right text-forest">{selectedWords}</dd>
      </dl>
    </DialogShell>
  )
}
