'use client'

import { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'

type HeadingItem = { id: string; level: number; text: string }

function headingsOf(editor: Editor): HeadingItem[] {
  const items: HeadingItem[] = []
  editor.state.doc.descendants((node) => {
    if (node.type.name !== 'heading') return
    items.push({
      id: typeof node.attrs.id === 'string' ? node.attrs.id : '',
      level: Number(node.attrs.level ?? 1),
      text: node.textContent,
    })
  })
  return items
}

export function OutlineSidebar({
  editor,
  visible,
}: {
  editor: Editor | null
  visible: boolean
}) {
  const [headings, setHeadings] = useState<HeadingItem[]>([])

  useEffect(() => {
    if (!editor) return
    const refresh = () => setHeadings(headingsOf(editor))
    refresh()
    editor.on('update', refresh)
    return () => {
      editor.off('update', refresh)
    }
  }, [editor])

  if (!visible) return null

  return (
    <aside className="hidden h-full min-h-0 w-56 shrink-0 flex-col border-r border-line bg-white print:hidden lg:flex">
      <div className="px-4 py-4">
        <Link href="/app">
          <Logo />
        </Link>
      </div>
      <Link href="/app" className="px-4 py-2 text-sm text-forest-2 hover:bg-mist">
        ← All documents
      </Link>
      <p className="px-4 pt-4 text-xs font-medium uppercase tracking-wide text-muted">Outline</p>
      <div className="flex-1 overflow-auto px-2 py-2">
        {headings.length === 0 ? (
          <p className="px-2 text-xs text-muted">Headings appear here as you write.</p>
        ) : (
          headings.map((heading) => (
            <button
              key={`${heading.id}-${heading.text}`}
              type="button"
              className="block w-full truncate rounded-md px-2 py-1 text-left text-xs text-forest-2 hover:bg-mist"
              style={{ paddingLeft: 8 + (heading.level - 1) * 10 }}
              onClick={() => {
                if (!heading.id || !editor) return
                const target = editor.view.dom.querySelector(`[data-id="${heading.id}"], [id="${heading.id}"]`)
                if (target instanceof HTMLElement) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              {heading.text || `Heading ${heading.level}`}
            </button>
          ))
        )}
      </div>
    </aside>
  )
}
