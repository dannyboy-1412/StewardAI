'use client'

import type { Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react'
import { NodeSelection } from '@tiptap/pm/state'
import { useState } from 'react'

const actions = [
  { label: 'Improve writing', prompt: 'Improve the writing of the selected text.' },
  { label: 'Make shorter', prompt: 'Make the selected text shorter without losing meaning.' },
  { label: 'Change tone', prompt: 'Rewrite the selected text in a more academic tone.' },
  { label: 'Format as title', prompt: 'Format the selected blocks as Title style without changing the wording.' },
  { label: 'Format as Heading 1', prompt: 'Turn the selected blocks into Heading 1 without changing the wording.' },
  {
    label: 'Use serif 12pt',
    prompt: 'Restyle the selected text to Georgia 12pt, keeping the existing wording.',
  },
  { label: 'Add citation', prompt: 'Add a citation to the selected passage using attached files if present. Verify the source first.' },
  { label: 'Check references', prompt: 'Check every citation in this document, match them to the reference list, and verify each reference. Do not invent sources.' },
  { label: 'Translate', prompt: 'Translate the selected text to English and keep formatting.' },
  { label: 'Explain this', prompt: 'Explain the selected passage.', mode: 'ask' as const },
]

export function SelectionPrompt({
  editor,
  onAsk,
}: {
  editor: Editor | null
  onAsk: (input: { instruction: string; mode: 'edit' | 'ask' }) => void
}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  if (!editor) return null

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 120 }}
      shouldShow={({ editor: current, state }) => {
        const { selection } = state
        return (
          current.view.hasFocus() &&
          !selection.empty &&
          !(selection instanceof NodeSelection)
        )
      }}
      className="rounded-xl border border-line bg-white p-2 shadow-lg"
    >
      <div className="flex flex-wrap gap-1">
        {actions.map((action) => (
          <button
            key={action.label}
            className="rounded-full px-2 py-1 text-xs hover:bg-mist"
            onClick={() => onAsk({ instruction: action.prompt, mode: action.mode ?? 'edit' })}
          >
            {action.label}
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-1">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Rewrite this paragraph…"
          className="h-8 flex-1 rounded-md border border-line px-2 text-xs"
        />
        <button
          className="rounded-full bg-forest px-3 text-xs text-white"
          onClick={() => {
            if (!value.trim()) return
            onAsk({ instruction: value, mode: 'edit' })
            setValue('')
            setOpen(false)
          }}
        >
          Go
        </button>
      </div>
      {open ? null : null}
    </BubbleMenu>
  )
}
