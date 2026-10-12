'use client'

import { useEffect, useState } from 'react'
import type { CitationStyle } from '@docai/document'
import { api, type CitationReportRecord } from '@/lib/api'
import { DialogShell } from '../editor/ui'

const STYLES: Array<{ id: CitationStyle; label: string }> = [
  { id: 'apa7', label: 'APA 7' },
  { id: 'harvard', label: 'Harvard' },
  { id: 'aglc4', label: 'AGLC4' },
  { id: 'ieee', label: 'IEEE' },
  { id: 'vancouver', label: 'Vancouver' },
]

export function ReferenceReport({
  documentId,
  onClose,
  onFormat,
}: {
  documentId: string
  onClose: () => void
  onFormat: (style: CitationStyle) => void
}) {
  const [report, setReport] = useState<CitationReportRecord | null>(null)
  const [style, setStyle] = useState<CitationStyle>('apa7')
  const [busy, setBusy] = useState(false)

  async function load() {
    const next = await api.getCitationReport(documentId)
    setReport(next)
    setStyle(next.style)
  }

  useEffect(() => {
    load().catch(() => setReport(null))
  }, [documentId])

  return (
    <DialogShell title="References" onClose={onClose} width="w-[min(640px,calc(100vw-2rem))]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <select
          className="rounded-md border border-line px-2 py-1.5 text-sm"
          value={style}
          onChange={async (event) => {
            const next = event.target.value as CitationStyle
            setStyle(next)
            setBusy(true)
            await api.setCitationStyle(documentId, next)
            setBusy(false)
          }}
        >
          {STYLES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="rounded-full bg-forest px-3 py-1.5 text-xs text-white disabled:opacity-50"
          disabled={busy}
          onClick={() => onFormat(style)}
        >
          Format verified references
        </button>
      </div>
      {!report ? <p className="text-sm text-muted">Checking references…</p> : null}
      {report ? (
        <div className="max-h-80 space-y-2 overflow-auto text-sm">
          {report.orphanCitations.length > 0 ? (
            <p className="text-xs text-red-700">
              In-text citations missing from the list: {report.orphanCitations.map((item) => item.text).join(', ')}
            </p>
          ) : null}
          {report.orphanReferences.length > 0 ? (
            <p className="text-xs text-red-700">
              Unused references: {report.orphanReferences.map((item) => item.surname ?? item.text).join(', ')}
            </p>
          ) : null}
          {report.entries.length === 0 ? <p className="text-muted">No reference list found.</p> : null}
          {report.entries.map((entry) => {
            const status = entry.verification?.status ?? 'unverified'
            const doi = entry.verification?.doi ?? entry.doi
            return (
              <div key={entry.blockId} className="rounded-md border border-line px-3 py-2">
                <p className="font-medium text-forest">{entry.text}</p>
                <p className="text-xs text-muted">
                  {status}
                  {doi ? (
                    <>
                      {' · '}
                      <a className="text-leaf" href={`https://doi.org/${doi}`} target="_blank" rel="noreferrer">
                        {doi}
                      </a>
                    </>
                  ) : null}
                </p>
              </div>
            )
          })}
        </div>
      ) : null}
    </DialogShell>
  )
}
