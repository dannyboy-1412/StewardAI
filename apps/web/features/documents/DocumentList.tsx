'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { api, type DocumentRecord } from '@/lib/api'

export function DocumentList() {
  const [docs, setDocs] = useState<DocumentRecord[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .listDocuments()
      .then(setDocs)
      .catch((err: Error) => setError(err.message))
  }, [])

  if (error) {
    return (
      <p className="mt-4 text-sm text-muted">
        Could not load documents. Start the API on port 4000.
      </p>
    )
  }

  if (docs.length === 0) {
    return <p className="mt-4 text-sm text-muted">No documents yet. Create one from a template.</p>
  }

  return (
    <div className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
      {docs.map((doc) => (
        <Link
          key={doc.id}
          href={`/d/${doc.id}`}
          className="flex items-center justify-between px-4 py-3 hover:bg-mist"
        >
          <span className="font-medium text-forest">{doc.title}</span>
          <span className="text-xs text-muted">
            {new Date(doc.updatedAt).toLocaleString()}
          </span>
        </Link>
      ))}
    </div>
  )
}
