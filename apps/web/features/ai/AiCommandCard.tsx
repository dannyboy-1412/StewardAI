'use client'

import { Paperclip, Sparkles } from 'lucide-react'
import { useRef, useState } from 'react'
import { VoiceButton } from './VoiceButton'
import { api, type FileRecord } from '@/lib/api'

const suggestions = [
  {
    title: 'Create a document',
    example: 'Write a 2,000-word report on renewable energy',
  },
  {
    title: 'Edit or improve',
    example: 'Make this section more concise',
  },
  {
    title: 'Change format',
    example: 'Add a table comparing energy sources',
  },
  {
    title: 'Add content',
    example: 'Include citations from these files',
  },
  {
    title: 'Ask a question',
    example: 'Explain this concept',
  },
]

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
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <p className="mb-2 text-sm font-medium text-forest">What would you like to do?</p>
      <div className="flex items-center gap-2 rounded-xl border border-line bg-mist/50 px-3 py-2">
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
          className="flex-1 bg-transparent text-sm outline-none"
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
      <div className="mt-3 space-y-1.5">
        {suggestions.map((item) => (
          <button
            key={item.title}
            className="block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-mist"
            onClick={() => setInstruction(item.example)}
          >
            <span className="font-medium text-forest">{item.title}</span>
            <span className="text-muted"> · {item.example}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
