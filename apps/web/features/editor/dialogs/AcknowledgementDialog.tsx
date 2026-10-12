'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { DialogShell } from '../ui'

export function AcknowledgementDialog({
  documentId,
  onClose,
  onInsert,
}: {
  documentId: string
  onClose: () => void
  onInsert: (statement: string) => void
}) {
  const [format, setFormat] = useState<'deakin' | 'usyd'>('deakin')
  const [statement, setStatement] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setBusy(true)
    api
      .createAcknowledgement(documentId, format)
      .then((result) => setStatement(result.statement))
      .catch(() => setStatement(''))
      .finally(() => setBusy(false))
  }, [documentId, format])

  return (
    <DialogShell title="AI acknowledgement" onClose={onClose} width="w-[min(560px,calc(100vw-2rem))]">
      <label className="mb-2 block text-xs text-muted">
        University format
        <select
          className="mt-1 w-full rounded-md border border-line px-2 py-1.5 text-sm"
          value={format}
          onChange={(event) => setFormat(event.target.value as 'deakin' | 'usyd')}
        >
          <option value="deakin">Deakin</option>
          <option value="usyd">University of Sydney</option>
        </select>
      </label>
      <textarea
        className="h-56 w-full rounded-md border border-line p-2 text-sm"
        value={statement}
        onChange={(event) => setStatement(event.target.value)}
        disabled={busy}
      />
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          className="rounded-full bg-forest px-3 py-1.5 text-xs text-white disabled:opacity-50"
          disabled={busy || !statement.trim()}
          onClick={() => onInsert(statement)}
        >
          Insert into document
        </button>
      </div>
    </DialogShell>
  )
}
