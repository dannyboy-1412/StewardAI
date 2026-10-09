'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import Collaboration from '@tiptap/extension-collaboration'
import { HocuspocusProvider } from '@hocuspocus/provider'
import * as Y from 'yjs'
import { Share, Sparkles, Star } from 'lucide-react'
import { createEditorExtensions } from '@docai/document/extensions'
import {
  DEFAULT_PAGE_SETTINGS,
  ensureDoc,
  isBlockNotFoundError,
  mergePageSettings,
  type JSONContent,
  type PageSettings,
} from '@docai/document'
import { STREAM_EVENT } from '@docai/shared'
import { api, authHeaders, documentPageSettings, getAccessToken } from '@/lib/api'
import { API_URL, COLLAB_URL } from '@/lib/env'
import { AiPanel, type ChatItem } from '@/features/ai/AiPanel'
import { SelectionPrompt } from '@/features/ai/SelectionPrompt'
import { applyIncomingPatch, shouldReconcile } from './apply-to-editor'
import type { EditorChrome, EditorDialog } from './chrome'
import { FindReplaceDialog } from './dialogs/FindReplaceDialog'
import { LinkDialog } from './dialogs/LinkDialog'
import { PageSetupDialog } from './dialogs/PageSetupDialog'
import { SpecialCharactersDialog } from './dialogs/SpecialCharactersDialog'
import { VersionHistoryPanel } from './dialogs/VersionHistoryPanel'
import { WordCountDialog } from './dialogs/WordCountDialog'
import { FindReplace } from './findReplace'
import { loadFontsFromContent } from './fonts'
import { insertImageFile, resolveEditorSrc } from './insertContent'
import { MenuBar } from './menubar/MenuBar'
import { OutlineSidebar } from './OutlineSidebar'
import { applyPaintFormat, copyPaintFormat, type PaintSnapshot } from './paintFormat'
import { createPageLayoutExtension, pageDimensions } from './pageLayout'
import { DocsShortcuts } from './shortcuts'
import { readSse } from './sse'
import { TableMenu } from './TableMenu'
import { Toolbar } from './toolbar/Toolbar'

function selectedBlockIds(editor: Editor): string[] {
  const ids: string[] = []
  const { from, to } = editor.state.selection
  editor.state.doc.nodesBetween(from, to, (node) => {
    if (typeof node.attrs?.id === 'string') ids.push(node.attrs.id)
  })
  return [...new Set(ids)]
}

function starredIds(): string[] {
  try {
    const raw = window.localStorage.getItem('docai-starred')
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function usePageFitZoom(pageWidth: number, zoom: number) {
  const [pane, setPane] = useState<HTMLDivElement | null>(null)
  const [availableWidth, setAvailableWidth] = useState(0)

  useEffect(() => {
    if (!pane) return

    const update = () => {
      const style = getComputedStyle(pane)
      const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
      setAvailableWidth(Math.max(0, pane.clientWidth - paddingX))
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(pane)
    return () => observer.disconnect()
  }, [pane])

  const fitZoom = availableWidth > 0 ? Math.min(zoom, (availableWidth - 2) / pageWidth) : zoom
  return { paneRef: setPane, fitZoom }
}

export function EditorWorkspace({ documentId }: { documentId: string }) {
  const router = useRouter()
  const [title, setTitle] = useState('Untitled document')
  const [pageSettings, setPageSettings] = useState<PageSettings>(DEFAULT_PAGE_SETTINGS)
  const [busy, setBusy] = useState(false)
  const [chat, setChat] = useState<ChatItem[]>([])
  const [dialog, setDialog] = useState<EditorDialog | null>(null)
  const [zoom, setZoom] = useState(1)
  const [showOutline, setShowOutline] = useState(true)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [paintArmed, setPaintArmed] = useState(false)
  const [starred, setStarred] = useState(false)
  const [saveState, setSaveState] = useState<'saved' | 'saving'>('saved')
  const abortRef = useRef<AbortController | null>(null)
  const ydocRef = useRef<Y.Doc>(new Y.Doc())
  const undoRef = useRef<Y.UndoManager | null>(null)
  const providerRef = useRef<HocuspocusProvider | null>(null)
  const paintRef = useRef<PaintSnapshot | null>(null)
  const skipPaintRef = useRef(false)
  const pendingContentRef = useRef<unknown>(null)

  const extensions = useMemo(
    () => [
      ...createEditorExtensions({ history: false, resolveImageSrc: resolveEditorSrc }),
      Collaboration.configure({ document: ydocRef.current }),
      createPageLayoutExtension(pageSettings),
      FindReplace,
      DocsShortcuts.configure({
        onFind: () => setDialog('find'),
        onLink: () => setDialog('link'),
      }),
    ],
    [pageSettings],
  )

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions,
      editorProps: {
        attributes: { class: 'editor-surface', spellcheck: 'true' },
      },
    },
    [extensions],
  )

  useEffect(() => {
    setStarred(starredIds().includes(documentId))
    let cancelled = false
    api.getDocument(documentId).then((doc) => {
      if (cancelled) return
      setTitle(doc.title)
      setPageSettings(documentPageSettings(doc))
      loadFontsFromContent(doc.contentJson)
      pendingContentRef.current = doc.contentJson
      const ydoc = ydocRef.current
      undoRef.current = new Y.UndoManager(ydoc.getXmlFragment('default'))
      const provider = new HocuspocusProvider({
        url: COLLAB_URL,
        name: documentId,
        document: ydoc,
        token: async () => (await getAccessToken()) ?? '',
      })
      providerRef.current = provider
    })
    return () => {
      cancelled = true
      providerRef.current?.destroy()
    }
  }, [documentId])

  useEffect(() => {
    if (!editor) return
    const applyPending = () => {
      const pending = pendingContentRef.current
      if (pending && editor.getText().trim().length === 0) {
        editor.commands.setContent(ensureDoc(pending))
      }
    }
    const timeout = window.setTimeout(applyPending, 600)
    return () => window.clearTimeout(timeout)
  }, [editor])

  useEffect(() => {
    if (!editor) return
    const handle = window.setInterval(() => {
      api.updateDocument(documentId, { title }).catch(() => undefined)
    }, 8000)
    return () => window.clearInterval(handle)
  }, [documentId, editor, title])

  useEffect(() => {
    if (!editor) return
    const onUpdate = () => {
      setSaveState('saving')
      window.setTimeout(() => setSaveState('saved'), 1200)
      loadFontsFromContent(editor.getJSON())
    }
    editor.on('update', onUpdate)
    return () => {
      editor.off('update', onUpdate)
    }
  }, [editor])

  useEffect(() => {
    if (!editor || !paintArmed) return
    const onSelect = () => {
      if (skipPaintRef.current) {
        skipPaintRef.current = false
        return
      }
      if (paintRef.current) applyPaintFormat(editor, paintRef.current)
      setPaintArmed(false)
    }
    editor.on('selectionUpdate', onSelect)
    return () => {
      editor.off('selectionUpdate', onSelect)
    }
  }, [editor, paintArmed])

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
    let outOfSync = false
    let finalDoc: JSONContent | undefined
    try {
      const response = await fetch(`${API_URL}/documents/${documentId}/ai/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({
          instruction: input.instruction,
          selectionBlockIds: selectedBlockIds(editor),
          fileIds: input.fileIds ?? [],
          snapshot: editor.getJSON(),
          mode: input.mode,
        }),
        signal: controller.signal,
      })
      if (response.status === 401) {
        window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`)
        throw new Error('Unauthorized')
      }
      if (!response.ok) throw new Error(await response.text())
      for await (const event of readSse(response)) {
        const type = String(event.type ?? '')
        if (type === STREAM_EVENT.patch || (type === 'data' && event.dataType === 'patch')) {
          if (outOfSync) continue
          try {
            applyIncomingPatch(editor, event.data, undoRef.current ?? undefined)
          } catch (error) {
            if (isBlockNotFoundError(error)) {
              outOfSync = true
              continue
            }
            throw error
          }
        }
        if (type === STREAM_EVENT.runFinished || (type === 'data' && event.dataType === 'run-finished')) {
          const data = event.data as { doc?: JSONContent } | undefined
          if (data?.doc) finalDoc = data.doc
        }
        if (type === 'text-delta' && typeof event.delta === 'string') {
          assistant += event.delta
        }
        if (typeof event.textDelta === 'string') assistant += event.textDelta
      }
      if (finalDoc && (outOfSync || shouldReconcile(editor.getJSON() as JSONContent, finalDoc))) {
        undoRef.current?.stopCapturing()
        editor.commands.setContent(finalDoc, false)
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

  const chrome: EditorChrome = {
    documentId,
    title,
    zoom,
    setZoom,
    showOutline,
    setShowOutline,
    showAiPanel,
    setShowAiPanel,
    paintArmed,
    armPaint: () => {
      if (!editor) return
      skipPaintRef.current = true
      paintRef.current = copyPaintFormat(editor)
      setPaintArmed(true)
    },
    openDialog: (next) => setDialog(next),
    print: () => window.print(),
    exportFile: async (format) => {
      const file = await api.exportDocument(documentId, format)
      downloadBlob(file.blob, file.filename)
    },
    importFile: () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.docx,.md,.txt,.html,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) return
        const created = await api.importDocument(file)
        router.push(`/d/${created.id}`)
      }
      input.click()
    },
    makeCopy: async () => {
      const copy = await api.copyDocument(documentId)
      router.push(`/d/${copy.id}`)
    },
    newDocument: async () => {
      const created = await api.createDocument({ templateId: 'blank' })
      router.push(`/d/${created.id}`)
    },
    openDocuments: () => router.push('/app'),
    insertImage: () => {
      if (editor) void insertImageFile(editor, documentId)
    },
    onUndo: () => undoRef.current?.undo(),
    onRedo: () => undoRef.current?.redo(),
    starred,
    toggleStar: () => {
      const next = starredIds().filter((id) => id !== documentId)
      if (!starred) next.push(documentId)
      window.localStorage.setItem('docai-starred', JSON.stringify(next))
      setStarred(!starred)
    },
    pageSettings,
  }

  const page = pageDimensions(pageSettings)
  const { paneRef, fitZoom } = usePageFitZoom(page.pageWidth, zoom)

  return (
    <div className="flex h-dvh overflow-hidden bg-[#eef4ec]">
      <OutlineSidebar editor={editor} visible={showOutline} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-line bg-white px-4 py-2 print:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={chrome.toggleStar}
                className={starred ? 'text-leaf' : 'text-muted'}
                aria-label="Star document"
              >
                <Star className={`h-4 w-4 ${starred ? 'fill-current' : ''}`} />
              </button>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={() => api.updateDocument(documentId, { title }).catch(() => undefined)}
                className="serif min-w-0 flex-1 bg-transparent text-lg text-forest outline-none"
              />
              <span className="whitespace-nowrap text-[11px] text-muted">
                {saveState === 'saving' ? 'Saving…' : 'All changes saved'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAiPanel((current) => !current)}
                aria-label="AI"
                aria-pressed={showAiPanel}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs ${
                  showAiPanel ? 'bg-sage text-forest' : 'bg-mist text-forest-2 hover:bg-sage'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" /> AI
              </button>
              <button className="inline-flex items-center gap-1 rounded-full bg-forest px-3 py-1.5 text-xs text-white">
                <Share className="h-3.5 w-3.5" /> Share
              </button>
            </div>
          </div>
          <MenuBar editor={editor} chrome={chrome} />
        </header>
        <div className="shrink-0 border-b border-line bg-white px-4 py-2 print:hidden">
          <Toolbar editor={editor} chrome={chrome} />
        </div>
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div ref={paneRef} className="min-w-0 flex-1 overflow-auto px-6 py-6">
            <div
              className="editor-page-canvas mx-auto"
              style={{
                width: page.pageWidth,
                zoom: fitZoom,
                background: pageSettings.pageColor,
              }}
            >
              <SelectionPrompt editor={editor} onAsk={runAi} />
              <TableMenu editor={editor} />
              <EditorContent editor={editor} />
            </div>
          </div>
          <AiPanel
            documentId={documentId}
            items={chat}
            busy={busy}
            visible={showAiPanel}
            onClose={() => setShowAiPanel(false)}
            onStop={() => abortRef.current?.abort()}
            onSubmit={runAi}
          />
        </div>
      </div>
      {editor && dialog === 'link' ? <LinkDialog editor={editor} onClose={() => setDialog(null)} /> : null}
      {editor && dialog === 'find' ? (
        <FindReplaceDialog editor={editor} onClose={() => setDialog(null)} />
      ) : null}
      {dialog === 'pageSetup' ? (
        <PageSetupDialog
          value={pageSettings}
          onClose={() => setDialog(null)}
          onSave={async (next) => {
            const merged = mergePageSettings(next)
            setPageSettings(merged)
            await api.updateDocument(documentId, { pageSettings: merged })
            setDialog(null)
          }}
        />
      ) : null}
      {editor && dialog === 'specialChars' ? (
        <SpecialCharactersDialog editor={editor} onClose={() => setDialog(null)} />
      ) : null}
      {editor && dialog === 'wordCount' ? (
        <WordCountDialog editor={editor} onClose={() => setDialog(null)} />
      ) : null}
      {dialog === 'versions' ? (
        <VersionHistoryPanel
          documentId={documentId}
          onClose={() => setDialog(null)}
          onRestored={() => window.location.reload()}
        />
      ) : null}
    </div>
  )
}
