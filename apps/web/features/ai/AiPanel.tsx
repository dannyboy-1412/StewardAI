'use client'

import { PanelRightClose } from 'lucide-react'
import { AiCommandCard } from './AiCommandCard'
import type { ChatItem } from './types'

export type { ChatItem }

export function AiPanel({
  documentId,
  items,
  busy,
  visible,
  onClose,
  onStop,
  onSubmit,
}: {
  documentId: string
  items: ChatItem[]
  busy: boolean
  visible: boolean
  onClose: () => void
  onStop: () => void
  onSubmit: (input: { instruction: string; fileIds: string[]; mode: 'edit' | 'ask' }) => void
}) {
  if (!visible) return null

  return (
    <aside className="flex h-full min-h-0 w-72 min-w-72 shrink-0 flex-col overflow-hidden border-l border-line bg-white print:hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-forest">AI</h2>
        <div className="flex items-center gap-3">
          {busy && (
            <button type="button" onClick={onStop} className="text-xs text-red-700">
              Stop
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-forest"
            aria-label="Hide AI"
          >
            <PanelRightClose className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="border-b border-line p-3">
        <AiCommandCard documentId={documentId} busy={busy} onSubmit={onSubmit} />
      </div>
      <div className="flex-1 space-y-3 overflow-auto p-4 text-sm">
        {items.length === 0 && (
          <p className="text-muted">Prompts and answers show up here. Edits wait for your review before they land in the document.</p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl px-3 py-2 ${
              item.role === 'user' ? 'bg-sage text-forest' : 'bg-mist text-forest-2'
            }`}
          >
            {item.text}
          </div>
        ))}
        {busy && <p className="text-xs text-muted">Working on the document…</p>}
      </div>
    </aside>
  )
}
