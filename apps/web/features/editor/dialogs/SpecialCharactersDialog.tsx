'use client'

import type { Editor } from '@tiptap/react'
import { DialogShell } from '../ui'

const CHARACTERS = [
  '—', '–', '…', '‘', '’', '“', '”', '•', '°', '€', '£', '¥', '©', '®', '™',
  '½', '¼', '¾', '×', '÷', '±', '≠', '≤', '≥', '∞', '→', '←', '↑', '↓', '§',
  '¶', '†', '‡', 'α', 'β', 'π', 'Σ', 'Ω', 'µ', '√', '≈', '′', '″',
]

export function SpecialCharactersDialog({
  editor,
  onClose,
}: {
  editor: Editor
  onClose: () => void
}) {
  return (
    <DialogShell title="Special characters" onClose={onClose}>
      <div className="grid grid-cols-8 gap-1">
        {CHARACTERS.map((character) => (
          <button
            key={character}
            type="button"
            className="grid h-9 place-items-center rounded-md hover:bg-mist"
            onClick={() => {
              editor.chain().focus().insertContent(character).run()
              onClose()
            }}
          >
            {character}
          </button>
        ))}
      </div>
    </DialogShell>
  )
}
