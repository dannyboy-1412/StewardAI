'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import Collaboration from '@tiptap/extension-collaboration'
import { HocuspocusProvider } from '@hocuspocus/provider'
import * as Y from 'yjs'
import { Share } from 'lucide-react'
import { createEditorExtensions } from '@docai/document/extensions'
import type { JSONContent } from '@docai/document'
import { Logo } from '@/components/Logo'
import { api, type DocumentRecord } from '@/lib/api'
import { API_URL, COLLAB_URL } from '@/lib/env'
import { AiCommandCard } from '@/features/ai/AiCommandCard'
import { AiPanel, type ChatItem } from '@/features/ai/AiPanel'
import { SelectionPrompt } from '@/features/ai/SelectionPrompt'
import { InsertMenu } from './InsertMenu'
import { Toolbar } from './Toolbar'
import { applyIncomingOp } from './apply-to-editor'
import { readSse } from './sse'

function selectedBlockIds(editor: Editor): string[] {
  const ids: string[] = []
  const { from, to } = editor.state.selection
  editor.state.doc.nodesBetween(from, to, (node) => {
    if (typeof node.attrs?.id === 'string') ids.push(node.attrs.id)
  })
  return [...new Set(ids)]
}

export function EditorWorkspace({ documentId }: { documentId: string }) {
  const [record, setRecord] = useState<DocumentRecord | null>(null)
  const [title, setTitle] = useState('Untitled document')
  const [busy, setBusy] = useState(false)
  const [chat, setChat] = useState<ChatItem[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const ydocRef = useRef<Y.Doc>(new Y.Doc())
  const undoRef = useRef<Y.UndoManager | null>(null)
  const providerRef = useRef<HocuspocusProvider | null>(null)

  const extensions = useMemo(
    () => [
      ...createEditorExtensions({ history: false }),
      Collaboration.configure({ document: ydocRef.current }),
    ],
    [],
  )

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    editorProps: {
      attributes: { class: 'editor-surface' },
    },
  })

  useEffect(() => {
    let cancelled = false
    api.getDocument(documentId).then((doc) => {
      if (cancelled) return
      setRecord(doc)
      setTitle(doc.title)
      const ydoc = ydocRef.current
      undoRef.current = new Y.UndoManager(ydoc.getXmlFragment('default'))
      const provider = new HocuspocusProvider({
        url: COLLAB_URL,
        name: documentId,
        document: ydoc,
      })
      providerRef.current = provider
      provider.on('status', ({ status }: { status: string }) => {
        if (status !== 'connected' && editor && !editor.getText() && doc.contentJson) {
          editor.commands.setContent(doc.contentJson as JSONContent)
        }
      })
      window.setTimeout(() => {
        if (editor && editor.getText().trim().length === 0 && doc.contentJson) {
          editor.commands.setContent(doc.contentJson as JSONContent)
        }
      }, 600)
    })
    return () => {
      cancelled = true
      providerRef.current?.destroy()
    }
  }, [documentId, editor])

  useEffect(() => {
    if (!editor) return
    const handle = window.setInterval(() => {
      if (!editor) return
      api
        .updateDocument(documentId, { title })
        .catch(() => undefined)
    }, 8000)
    return () => window.clearInterval(handle)
  }, [documentId, editor, title])

  async function runAi(input: {
    instruction: string
    fileIds?: string[]
    mode: 'edit' | 'ask'
  }) {
    if (!editor) return
    setBusy(true)
    editor.setEditable(false)
    undoRef.current?.stopCapturing()
    const controller = new AbortController()
    abortRef.current = controller
    const userItem: ChatItem = {
      id: crypto.randomUUID(),
      role: 'user',
      text: input.instruction,
    }
    setChat((current) => [...current, userItem])
    let assistant = ''
    try {
      const response = await fetch(`${API_URL}/documents/${documentId}/ai/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: input.instruction,
          selectionBlockIds: selectedBlockIds(editor),
          fileIds: input.fileIds ?? [],
          snapshot: editor.getJSON(),
          mode: input.mode,
        }),
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(await response.text())
      for await (const event of readSse(response)) {
        const type = String(event.type ?? '')
        if (type === 'data-op' || (type === 'data' && event.dataType === 'op')) {
          applyIncomingOp(editor, event.data, undoRef.current ?? undefined)
        }
        if (type === 'text-delta' && typeof event.delta === 'string') {
          assistant += event.delta
        }
        if (typeof event.textDelta === 'string') assistant += event.textDelta
      }
      if (assistant.trim()) {
        setChat((current) => [
          ...current,
          { id: crypto.randomUUID(), role: 'assistant', text: assistant.trim() },
        ])
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setChat((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: error instanceof Error ? error.message : 'The AI run failed.',
          },
        ])
      }
    } finally {
      undoRef.current?.stopCapturing()
      editor.setEditable(true)
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#eef4ec]">
      <aside className="hidden w-56 flex-col border-r border-line bg-white lg:flex">
        <div className="px-4 py-4">
          <Link href="/app">
            <Logo />
          </Link>
        </div>
        <Link href="/app" className="px-4 py-2 text-sm text-forest-2 hover:bg-mist">
          ← All documents
        </Link>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-white px-4 py-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={() => api.updateDocument(documentId, { title }).catch(() => undefined)}
            className="serif bg-transparent text-lg text-forest outline-none"
          />
          <button className="inline-flex items-center gap-1 rounded-full bg-forest px-3 py-1.5 text-xs text-white">
            <Share className="h-3.5 w-3.5" /> Share
          </button>
        </header>
        <div className="border-b border-line bg-white px-4 py-2">
          <Toolbar
            editor={editor}
            onUndo={() => undoRef.current?.undo()}
            onRedo={() => undoRef.current?.redo()}
          />
        </div>
        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1 overflow-auto px-6 py-6">
            <div className="mx-auto mb-4 max-w-3xl">
              <AiCommandCard documentId={documentId} busy={busy} onSubmit={runAi} />
            </div>
            <div className="mx-auto mb-4 max-w-3xl">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                Add anything to your document
              </p>
              <InsertMenu editor={editor} documentId={documentId} />
            </div>
            <article className="mx-auto min-h-[70vh] max-w-3xl rounded-2xl bg-white px-12 py-10 shadow-[0_16px_50px_rgba(20,40,30,0.08)]">
              <SelectionPrompt editor={editor} onAsk={runAi} />
              <EditorContent editor={editor} />
            </article>
          </div>
          <AiPanel
            items={chat}
            busy={busy}
            onStop={() => abortRef.current?.abort()}
          />
        </div>
      </div>
    </div>
  )
}
