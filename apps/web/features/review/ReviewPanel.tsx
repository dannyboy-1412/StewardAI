'use client'

import { PanelRightClose } from 'lucide-react'
import type { ProposedChange } from '@docai/document'

export function ReviewPanel({
  changes,
  acceptedIds,
  busy,
  onToggle,
  onAcceptAll,
  onRejectAll,
  onApply,
  onClose,
}: {
  changes: ProposedChange[]
  acceptedIds: string[]
  busy: boolean
  onToggle: (id: string, accepted: boolean) => void
  onAcceptAll: () => void
  onRejectAll: () => void
  onApply: () => void
  onClose: () => void
}) {
  const accepted = new Set(acceptedIds)

  return (
    <aside className="flex h-full min-h-0 w-80 min-w-80 shrink-0 flex-col overflow-hidden border-l border-line bg-white print:hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-forest">Review edits</h2>
        <button type="button" onClick={onClose} className="text-muted hover:text-forest" aria-label="Hide AI">
          <PanelRightClose className="h-4 w-4" />
        </button>
      </div>
      <div className="flex gap-2 border-b border-line px-3 py-2">
        <button type="button" className="rounded-md border border-line px-2 py-1 text-xs" onClick={onAcceptAll}>
          Accept all
        </button>
        <button type="button" className="rounded-md border border-line px-2 py-1 text-xs" onClick={onRejectAll}>
          Reject all
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-auto p-3 text-sm">
        {changes.length === 0 ? <p className="text-muted">No document changes to review.</p> : null}
        {changes.map((change) => {
          const isAccepted = accepted.has(change.id)
          return (
            <div key={change.id} className="rounded-xl border border-line px-3 py-2">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {change.kind}
                </span>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={isAccepted}
                    onChange={(event) => onToggle(change.id, event.target.checked)}
                  />
                  Accept
                </label>
              </div>
              {change.reason ? <p className="mb-2 text-xs text-forest-2">{change.reason}</p> : null}
              {change.beforeMarkdown ? (
                <p className="mb-1 text-xs text-muted line-through">{change.beforeMarkdown}</p>
              ) : null}
              {change.afterMarkdown ? (
                <p className="text-xs text-forest">{change.afterMarkdown}</p>
              ) : null}
            </div>
          )
        })}
      </div>
      <div className="border-t border-line p-3">
        <button
          type="button"
          disabled={busy}
          onClick={onApply}
          className="w-full rounded-full bg-forest px-3 py-2 text-xs text-white disabled:opacity-50"
        >
          Apply selected
        </button>
      </div>
    </aside>
  )
}
