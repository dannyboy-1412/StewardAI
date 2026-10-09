'use client'

import { useEffect, useState } from 'react'
import { api, type VersionRecord } from '@/lib/api'
import { DialogShell } from '../ui'

export function VersionHistoryPanel({
  documentId,
  onClose,
  onRestored,
}: {
  documentId: string
  onClose: () => void
  onRestored: () => void
}) {
  const [versions, setVersions] = useState<VersionRecord[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.listVersions(documentId).then(setVersions).catch(() => setVersions([]))
  }, [documentId])

  return (
    <DialogShell title="Version history" onClose={onClose} width="w-[min(420px,calc(100vw-2rem))]">
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          className="rounded-md border border-line px-3 py-1.5 text-xs"
          onClick={async () => {
            setBusy(true)
            await api.saveVersion(documentId, 'Named snapshot')
            setVersions(await api.listVersions(documentId))
            setBusy(false)
          }}
        >
          Save snapshot
        </button>
      </div>
      <div className="max-h-80 space-y-2 overflow-auto">
        {versions.length === 0 ? <p className="text-sm text-muted">No versions yet.</p> : null}
        {versions.map((version) => (
          <div key={version.id} className="rounded-md border border-line px-3 py-2 text-sm">
            <p className="font-medium text-forest">{version.label ?? version.source}</p>
            <p className="text-xs text-muted">{new Date(version.createdAt).toLocaleString()}</p>
            <button
              type="button"
              disabled={busy}
              className="mt-2 text-xs text-leaf"
              onClick={async () => {
                setBusy(true)
                await api.restoreVersion(documentId, version.id)
                setBusy(false)
                onRestored()
              }}
            >
              Restore
            </button>
          </div>
        ))}
      </div>
    </DialogShell>
  )
}
