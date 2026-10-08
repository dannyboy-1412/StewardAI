'use client'

import type { Editor } from '@tiptap/react'
import { Code, Divide, ImageIcon, Sigma, Table as TableIcon } from 'lucide-react'
import { api } from '@/lib/api'

const items = [
  { id: 'table', label: 'Table', icon: TableIcon },
  { id: 'image', label: 'Image', icon: ImageIcon },
  { id: 'code', label: 'Code block', icon: Code },
  { id: 'equation', label: 'Equation', icon: Sigma },
  { id: 'divider', label: 'Divider', icon: Divide },
] as const

export function InsertMenu({
  editor,
  documentId,
}: {
  editor: Editor | null
  documentId: string
}) {
  if (!editor) return null

  async function run(id: (typeof items)[number]['id']) {
    if (!editor) return
    if (id === 'table') {
      editor.chain().focus().insertTable({ rows: 4, cols: 4, withHeaderRow: true }).run()
    }
    if (id === 'code') editor.chain().focus().toggleCodeBlock().run()
    if (id === 'divider') editor.chain().focus().setHorizontalRule().run()
    if (id === 'equation') {
      const latex = window.prompt('LaTeX') ?? 'E = mc^2'
      editor.chain().focus().insertContent({ type: 'equation', attrs: { latex } }).run()
    }
    if (id === 'image') {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) return
        const uploaded = await api.uploadFile(file, documentId)
        const src = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/files/${uploaded.id}`
        editor.chain().focus().setImage({ src, alt: file.name }).run()
      }
      input.click()
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => run(item.id)}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs text-forest-2 hover:bg-mist"
        >
          <item.icon className="h-3.5 w-3.5" />
          {item.label}
        </button>
      ))}
    </div>
  )
}
