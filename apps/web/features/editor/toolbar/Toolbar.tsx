'use client'

import { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/react'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  CheckSquare,
  Eraser,
  Highlighter,
  ImageIcon,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Paintbrush,
  Plus,
  Printer,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react'
import type { EditorChrome } from '../chrome'
import {
  DEFAULT_EDITOR_FONT,
  DEFAULT_EDITOR_FONT_SIZE,
  DOCUMENT_FONTS,
  FONT_SIZES_PT,
  ensureFontLoaded,
  fontCss,
  stepFontSize,
} from '../fonts'
import { Dropdown, IconButton, ToolbarDivider } from '../ui'

const TEXT_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00',
  '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
]

const HIGHLIGHT_COLORS = [
  '#ffffff', '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ff9900', '#cfe9c8', '#fce8b2',
]

const LINE_HEIGHTS = ['1', '1.15', '1.5', '2']

function ColorGrid({
  colors,
  onPick,
}: {
  colors: string[]
  onPick: (color: string) => void
}) {
  return (
    <div className="grid grid-cols-5 gap-1 px-2 py-1">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          title={color}
          className="h-5 w-5 rounded-sm border border-line"
          style={{ background: color }}
          onClick={() => onPick(color)}
        />
      ))}
    </div>
  )
}

function currentStyle(editor: Editor): string {
  if (editor.isActive('heading', { level: 1 })) return 'h1'
  if (editor.isActive('heading', { level: 2 })) return 'h2'
  if (editor.isActive('heading', { level: 3 })) return 'h3'
  if (editor.isActive('heading', { level: 4 })) return 'h4'
  if (editor.isActive('heading', { level: 5 })) return 'h5'
  if (editor.isActive('heading', { level: 6 })) return 'h6'
  if (editor.isActive('paragraph', { styleName: 'title' })) return 'title'
  if (editor.isActive('paragraph', { styleName: 'subtitle' })) return 'subtitle'
  return 'p'
}

export function Toolbar({ editor, chrome }: { editor: Editor | null; chrome: EditorChrome }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!editor) return
    const update = () => setTick((value) => value + 1)
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('transaction', update)
    }
  }, [editor])

  if (!editor) return null

  const fontFamilyAttr = editor.getAttributes('textStyle').fontFamily || DEFAULT_EDITOR_FONT
  const fontFamily =
    DOCUMENT_FONTS.find((font) => font.css === fontFamilyAttr || font.id === fontFamilyAttr)?.id ??
    DEFAULT_EDITOR_FONT
  const fontSize = editor.getAttributes('textStyle').fontSize || DEFAULT_EDITOR_FONT_SIZE
  const style = currentStyle(editor)

  return (
    <div className="flex flex-wrap items-center gap-0.5">
      <IconButton title="Undo" onClick={chrome.onUndo}>
        <Undo2 className="h-4 w-4" />
      </IconButton>
      <IconButton title="Redo" onClick={chrome.onRedo}>
        <Redo2 className="h-4 w-4" />
      </IconButton>
      <IconButton title="Print" onClick={chrome.print}>
        <Printer className="h-4 w-4" />
      </IconButton>
      <IconButton title="Paint format" active={chrome.paintArmed} onClick={chrome.armPaint}>
        <Paintbrush className="h-4 w-4" />
      </IconButton>
      <Dropdown label={`${Math.round(chrome.zoom * 100)}%`} width="w-28">
        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((value) => (
          <button
            key={value}
            type="button"
            className="block w-full px-3 py-1.5 text-left text-sm hover:bg-mist"
            onClick={() => chrome.setZoom(value)}
          >
            {Math.round(value * 100)}%
          </button>
        ))}
      </Dropdown>
      <ToolbarDivider />
      <select
        className="h-8 rounded-md border border-line bg-white px-2 text-sm"
        value={style}
        onChange={(event) => {
          const value = event.target.value
          if (value === 'p') editor.chain().focus().setParagraph().setParagraphStyle(null).run()
          if (value === 'title') editor.chain().focus().setParagraphStyle('title').run()
          if (value === 'subtitle') editor.chain().focus().setParagraphStyle('subtitle').run()
          if (value.startsWith('h')) {
            const level = Number(value.slice(1)) as 1 | 2 | 3 | 4 | 5 | 6
            editor.chain().focus().toggleHeading({ level }).run()
          }
        }}
      >
        <option value="p">Normal text</option>
        <option value="title">Title</option>
        <option value="subtitle">Subtitle</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="h4">Heading 4</option>
        <option value="h5">Heading 5</option>
        <option value="h6">Heading 6</option>
      </select>
      <select
        aria-label="Font"
        className="h-8 max-w-[140px] rounded-md border border-line bg-white px-2 text-sm"
        value={fontFamily}
        style={{ fontFamily: fontCss(fontFamily) }}
        onChange={(event) => {
          const font = DOCUMENT_FONTS.find((item) => item.id === event.target.value)
          if (font) ensureFontLoaded(font.id)
          editor.chain().focus().setFontFamily(font?.css ?? event.target.value).run()
        }}
      >
        {DOCUMENT_FONTS.map((font) => (
          <option key={font.id} value={font.id} style={{ fontFamily: font.css }}>
            {font.id}
          </option>
        ))}
      </select>
      <IconButton
        title="Decrease font size"
        onClick={() => editor.chain().focus().setFontSize(stepFontSize(String(fontSize), -1)).run()}
      >
        <Minus className="h-3.5 w-3.5" />
      </IconButton>
      <select
        aria-label="Font size"
        className="h-8 w-16 rounded-md border border-line bg-white px-1 text-sm"
        value={String(fontSize).replace('pt', '')}
        onChange={(event) => editor.chain().focus().setFontSize(`${event.target.value}pt`).run()}
      >
        {FONT_SIZES_PT.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <IconButton
        title="Increase font size"
        onClick={() => editor.chain().focus().setFontSize(stepFontSize(String(fontSize), 1)).run()}
      >
        <Plus className="h-3.5 w-3.5" />
      </IconButton>
      <ToolbarDivider />
      <IconButton
        title="Bold"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </IconButton>
      <IconButton
        title="Italic"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </IconButton>
      <IconButton
        title="Underline"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="h-4 w-4" />
      </IconButton>
      <Dropdown label={<span className="text-sm font-semibold">A</span>} width="w-40">
        <ColorGrid
          colors={TEXT_COLORS}
          onPick={(color) => editor.chain().focus().setColor(color).run()}
        />
      </Dropdown>
      <Dropdown label={<Highlighter className="h-4 w-4" />} width="w-40">
        <button
          type="button"
          className="block w-full px-3 py-1.5 text-left text-xs hover:bg-mist"
          onClick={() => editor.chain().focus().unsetHighlight().run()}
        >
          None
        </button>
        <ColorGrid
          colors={HIGHLIGHT_COLORS}
          onPick={(color) => editor.chain().focus().toggleHighlight({ color }).run()}
        />
      </Dropdown>
      <IconButton title="Link" onClick={() => chrome.openDialog('link')}>
        <LinkIcon className="h-4 w-4" />
      </IconButton>
      <IconButton title="Insert image" onClick={chrome.insertImage}>
        <ImageIcon className="h-4 w-4" />
      </IconButton>
      <ToolbarDivider />
      <IconButton title="Align left" onClick={() => editor.chain().focus().setTextAlign('left').run()}>
        <AlignLeft className="h-4 w-4" />
      </IconButton>
      <IconButton title="Align center" onClick={() => editor.chain().focus().setTextAlign('center').run()}>
        <AlignCenter className="h-4 w-4" />
      </IconButton>
      <IconButton title="Align right" onClick={() => editor.chain().focus().setTextAlign('right').run()}>
        <AlignRight className="h-4 w-4" />
      </IconButton>
      <IconButton title="Justify" onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
        <AlignJustify className="h-4 w-4" />
      </IconButton>
      <Dropdown label="Line & spacing" width="w-44">
        {LINE_HEIGHTS.map((value) => (
          <button
            key={value}
            type="button"
            className="block w-full px-3 py-1.5 text-left text-sm hover:bg-mist"
            onClick={() => editor.chain().focus().setLineHeight(value).run()}
          >
            {value}
          </button>
        ))}
        <button
          type="button"
          className="block w-full px-3 py-1.5 text-left text-sm hover:bg-mist"
          onClick={() => editor.chain().focus().setParagraphSpacing({ spaceBefore: 12 }).run()}
        >
          Add space before
        </button>
        <button
          type="button"
          className="block w-full px-3 py-1.5 text-left text-sm hover:bg-mist"
          onClick={() => editor.chain().focus().setParagraphSpacing({ spaceAfter: 12 }).run()}
        >
          Add space after
        </button>
      </Dropdown>
      <IconButton
        title="Checklist"
        active={editor.isActive('taskList')}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <CheckSquare className="h-4 w-4" />
      </IconButton>
      <IconButton
        title="Bullets"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </IconButton>
      <IconButton
        title="Numbered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </IconButton>
      <IconButton title="Decrease indent" onClick={() => editor.chain().focus().decreaseIndent().run()}>
        <IndentDecrease className="h-4 w-4" />
      </IconButton>
      <IconButton title="Increase indent" onClick={() => editor.chain().focus().increaseIndent().run()}>
        <IndentIncrease className="h-4 w-4" />
      </IconButton>
      <IconButton
        title="Clear formatting"
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
      >
        <Eraser className="h-4 w-4" />
      </IconButton>
      <IconButton
        title="Strikethrough"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </IconButton>
    </div>
  )
}
