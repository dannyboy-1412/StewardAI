'use client'

import type { Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react'

export function TableMenu({ editor }: { editor: Editor | null }) {
  if (!editor) return null
  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 120, placement: 'top' }}
      shouldShow={({ editor: current }) => current.isActive('table')}
      className="flex flex-wrap gap-1 rounded-lg border border-line bg-white p-1 shadow-lg"
    >
      {[
        { label: 'Col before', run: () => editor.chain().focus().addColumnBefore().run() },
        { label: 'Col after', run: () => editor.chain().focus().addColumnAfter().run() },
        { label: 'Delete col', run: () => editor.chain().focus().deleteColumn().run() },
        { label: 'Row before', run: () => editor.chain().focus().addRowBefore().run() },
        { label: 'Row after', run: () => editor.chain().focus().addRowAfter().run() },
        { label: 'Delete row', run: () => editor.chain().focus().deleteRow().run() },
        { label: 'Merge', run: () => editor.chain().focus().mergeCells().run() },
        { label: 'Split', run: () => editor.chain().focus().splitCell().run() },
        { label: 'Delete table', run: () => editor.chain().focus().deleteTable().run() },
      ].map((item) => (
        <button
          key={item.label}
          type="button"
          className="rounded-md px-2 py-1 text-[11px] text-forest-2 hover:bg-mist"
          onClick={item.run}
        >
          {item.label}
        </button>
      ))}
    </BubbleMenu>
  )
}
