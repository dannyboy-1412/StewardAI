'use client'

import type { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo2,
  Redo2,
} from 'lucide-react'

function Button({
  active,
  onClick,
  children,
}: {
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-md ${
        active ? 'bg-sage text-forest' : 'text-forest-2 hover:bg-mist'
      }`}
    >
      {children}
    </button>
  )
}

export function Toolbar({
  editor,
  onUndo,
  onRedo,
}: {
  editor: Editor | null
  onUndo?: () => void
  onRedo?: () => void
}) {
  if (!editor) return null
  return (
    <div className="flex flex-wrap items-center gap-1">
      <select
        className="h-8 rounded-md border border-line bg-white px-2 text-sm"
        value={
          editor.isActive('heading', { level: 1 })
            ? 'h1'
            : editor.isActive('heading', { level: 2 })
              ? 'h2'
              : editor.isActive('heading', { level: 3 })
                ? 'h3'
                : 'p'
        }
        onChange={(event) => {
          const value = event.target.value
          if (value === 'p') editor.chain().focus().setParagraph().run()
          if (value === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run()
          if (value === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run()
          if (value === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run()
        }}
      >
        <option value="p">Normal text</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>
      <Button active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>
      <Button
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => {
          const href = window.prompt('Link URL')
          if (href) editor.chain().focus().setLink({ href }).run()
        }}
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
      <Button onClick={() => editor.chain().focus().setTextAlign('left').run()}>
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button onClick={() => editor.chain().focus().setTextAlign('center').run()}>
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button onClick={() => editor.chain().focus().setTextAlign('right').run()}>
        <AlignRight className="h-4 w-4" />
      </Button>
      <Button
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button onClick={() => onUndo?.()}>
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button onClick={() => onRedo?.()}>
        <Redo2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
