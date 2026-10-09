'use client'

import { Paperclip, Sparkles } from 'lucide-react'
import { useRef, useState } from 'react'
import { VoiceButton } from './VoiceButton'
import { api, type FileRecord } from '@/lib/api'

export function AiCommandCard({
  documentId,
  busy,
  onSubmit,
}: {
  documentId: string
  busy: boolean
  onSubmit: (input: {
    instruction: string
    fileIds: string[]
    mode: 'edit' | 'ask'
  }) => void
}) {
  const [instruction, setInstruction] = useState('')
  const [files, setFiles] = useState<FileRecord[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  async function attach(fileList: FileList | null) {
    if (!fileList) return
    const uploaded: FileRecord[] = []
    for (const file of Array.from(fileList)) {
      uploaded.push(await api.uploadFile(file, documentId))
    }
    setFiles((current) => [...current, ...uploaded])
  }

  function send(mode: 'edit' | 'ask' = 'edit') {
    if (!instruction.trim() || busy) return
    onSubmit({ instruction, fileIds: files.map((file) => file.id), mode })
    setInstruction('')
  }

  return (
    <div>
      <div className="flex min-w-0 items-center gap-1.5 rounded-xl border border-line bg-mist/50 px-2 py-2">
        <input
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              send(instruction.toLowerCase().startsWith('explain') ? 'ask' : 'edit')
            }
          }}
          placeholder="Type or speak your instruction…"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          disabled={busy}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-muted"
          aria-label="Attach files"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          onChange={(event) => attach(event.target.files)}
        />
        <VoiceButton
          onTranscript={(text) => setInstruction((current) => `${current} ${text}`.trim())}
        />
        <button
          onClick={() => send()}
          disabled={busy}
          className="grid h-9 w-9 place-items-center rounded-full bg-forest text-white disabled:opacity-50"
          aria-label="Send"
        >
          <Sparkles className="h-4 w-4" />
        </button>
      </div>
      {files.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {files.map((file) => (
            <span key={file.id} className="rounded-full bg-sage px-2 py-0.5 text-xs">
              {file.filename}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
