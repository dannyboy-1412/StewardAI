'use client'

import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import { DialogShell } from '../ui'

export function LinkDialog({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const current = editor.getAttributes('link').href
  const [href, setHref] = useState(typeof current === 'string' ? current : '')

  return (
    <DialogShell title="Link" onClose={onClose}>
      <input
        value={href}
        onChange={(event) => setHref(event.target.value)}
        placeholder="https://"
        className="mb-3 h-9 w-full rounded-md border border-line px-2 text-sm"
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="rounded-md px-3 py-1.5 text-sm text-muted"
          onClick={() => {
            editor.chain().focus().unsetLink().run()
            onClose()
          }}
        >
          Remove
        </button>
        <button
          type="button"
          className="rounded-md bg-forest px-3 py-1.5 text-sm text-white"
          onClick={() => {
            if (href.trim()) editor.chain().focus().setLink({ href: href.trim() }).run()
            onClose()
          }}
        >
          Apply
        </button>
      </div>
    </DialogShell>
  )
}
