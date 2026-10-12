'use client'

import { useEffect, useState } from 'react'
import { api, type AiRunRecord } from '@/lib/api'
import { DialogShell } from '../ui'

export function AiActivityPanel({
  documentId,
  onClose,
  onInsertAppendix,
}: {
  documentId: string
  onClose: () => void
  onInsertAppendix: () => Promise<void>
}) {
  const [runs, setRuns] = useState<AiRunRecord[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.listAiRuns(documentId).then(setRuns).catch(() => setRuns([]))
  }, [documentId])

  return (
    <DialogShell title="AI activity" onClose={onClose} width="w-[min(520px,calc(100vw-2rem))]">
      <div className="mb-3 flex justify-end gap-2">
        <button
          type="button"
          className="rounded-md border border-line px-3 py-1.5 text-xs"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              const file = await api.exportAiLog(documentId, 'docx')
              const url = URL.createObjectURL(file.blob)
              const link = document.createElement('a')
              link.href = url
              link.download = file.filename
              link.click()
              URL.revokeObjectURL(url)
            } finally {
              setBusy(false)
            }
          }}
        >
          Export log
        </button>
        <button
          type="button"
          className="rounded-md border border-line px-3 py-1.5 text-xs"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              await onInsertAppendix()
              onClose()
            } finally {
              setBusy(false)
            }
          }}
        >
          Insert as appendix
        </button>
      </div>
      <div className="max-h-80 space-y-2 overflow-auto">
        {runs.length === 0 ? <p className="text-sm text-muted">No AI runs yet.</p> : null}
        {runs.map((run) => (
          <div key={run.id} className="rounded-md border border-line px-3 py-2 text-sm">
            <p className="font-medium text-forest">{run.prompt}</p>
            <p className="text-xs text-muted">
              {new Date(run.createdAt).toLocaleString()} · {run.model} · {run.reviewStatus ?? run.status}
            </p>
            {run.responseText ? <p className="mt-1 text-xs text-forest-2">{run.responseText}</p> : null}
          </div>
        ))}
      </div>
    </DialogShell>
  )
}
