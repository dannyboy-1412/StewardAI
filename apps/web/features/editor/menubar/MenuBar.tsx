'use client'

import type { Editor } from '@tiptap/react'
import type { EditorChrome } from '../chrome'
import { insertEquation } from '../insertContent'
import { Dropdown, MenuItem } from '../ui'

export function MenuBar({ editor, chrome }: { editor: Editor | null; chrome: EditorChrome }) {
  if (!editor) return null

  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm print:hidden">
      <Dropdown label="File">
        <MenuItem onClick={chrome.newDocument}>New</MenuItem>
        <MenuItem onClick={chrome.openDocuments}>Open</MenuItem>
        <MenuItem onClick={chrome.makeCopy}>Make a copy</MenuItem>
        <MenuItem onClick={chrome.importFile}>Import</MenuItem>
        <MenuItem onClick={() => chrome.exportFile('docx')}>Download .docx</MenuItem>
        <MenuItem onClick={chrome.print}>Download PDF</MenuItem>
        <MenuItem onClick={() => chrome.exportFile('md')}>Download .md</MenuItem>
        <MenuItem onClick={() => chrome.exportFile('txt')}>Download .txt</MenuItem>
        <MenuItem onClick={() => chrome.exportFile('html')}>Download .html</MenuItem>
        <MenuItem onClick={() => chrome.openDialog('pageSetup')}>Page setup</MenuItem>
        <MenuItem onClick={chrome.print} shortcut="Ctrl+P">Print</MenuItem>
        <MenuItem onClick={() => chrome.openDialog('versions')}>Version history</MenuItem>
      </Dropdown>
      <Dropdown label="Edit">
        <MenuItem onClick={chrome.onUndo} shortcut="Ctrl+Z">Undo</MenuItem>
        <MenuItem onClick={chrome.onRedo} shortcut="Ctrl+Y">Redo</MenuItem>
        <MenuItem onClick={() => document.execCommand('cut')} shortcut="Ctrl+X">Cut</MenuItem>
        <MenuItem onClick={() => document.execCommand('copy')} shortcut="Ctrl+C">Copy</MenuItem>
        <MenuItem onClick={() => document.execCommand('paste')} shortcut="Ctrl+V">Paste</MenuItem>
        <MenuItem onClick={() => editor.chain().focus().selectAll().run()} shortcut="Ctrl+A">
          Select all
        </MenuItem>
        <MenuItem onClick={() => chrome.openDialog('find')} shortcut="Ctrl+H">
          Find and replace
        </MenuItem>
      </Dropdown>
      <Dropdown label="View">
        <MenuItem onClick={() => chrome.setShowOutline(!chrome.showOutline)}>
          {chrome.showOutline ? 'Hide outline' : 'Show outline'}
        </MenuItem>
        <MenuItem onClick={() => chrome.setShowAiPanel(!chrome.showAiPanel)}>
          {chrome.showAiPanel ? 'Hide AI' : 'Show AI'}
        </MenuItem>
        {[0.5, 0.75, 1, 1.25, 1.5].map((value) => (
          <MenuItem key={value} onClick={() => chrome.setZoom(value)} active={chrome.zoom === value}>
            Zoom {Math.round(value * 100)}%
          </MenuItem>
        ))}
      </Dropdown>
      <Dropdown label="Insert">
        <MenuItem onClick={chrome.insertImage}>Image</MenuItem>
        <MenuItem
          onClick={() => editor.chain().focus().insertTable({ rows: 4, cols: 4, withHeaderRow: true }).run()}
        >
          Table
        </MenuItem>
        <MenuItem onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          Horizontal line
        </MenuItem>
        <MenuItem onClick={() => editor.chain().focus().insertPageBreak().run()} shortcut="Ctrl+Enter">
          Page break
        </MenuItem>
        <MenuItem onClick={() => editor.chain().focus().insertTableOfContents().run()}>
          Table of contents
        </MenuItem>
        <MenuItem onClick={() => insertEquation(editor)}>Equation</MenuItem>
        <MenuItem onClick={() => chrome.openDialog('specialChars')}>Special characters</MenuItem>
        <MenuItem onClick={() => chrome.openDialog('link')} shortcut="Ctrl+K">Link</MenuItem>
        <MenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()}>Code block</MenuItem>
      </Dropdown>
      <Dropdown label="Format">
        <MenuItem onClick={() => editor.chain().focus().toggleBold().run()} shortcut="Ctrl+B">
          Bold
        </MenuItem>
        <MenuItem onClick={() => editor.chain().focus().toggleItalic().run()} shortcut="Ctrl+I">
          Italic
        </MenuItem>
        <MenuItem onClick={() => editor.chain().focus().toggleUnderline().run()} shortcut="Ctrl+U">
          Underline
        </MenuItem>
        <MenuItem onClick={() => editor.chain().focus().toggleStrike().run()}>Strikethrough</MenuItem>
        <MenuItem onClick={() => editor.chain().focus().toggleSuperscript().run()}>Superscript</MenuItem>
        <MenuItem onClick={() => editor.chain().focus().toggleSubscript().run()}>Subscript</MenuItem>
        <MenuItem onClick={() => editor.chain().focus().setTextAlign('left').run()}>Align left</MenuItem>
        <MenuItem onClick={() => editor.chain().focus().setTextAlign('center').run()}>Align center</MenuItem>
        <MenuItem onClick={() => editor.chain().focus().setTextAlign('right').run()}>Align right</MenuItem>
        <MenuItem onClick={() => editor.chain().focus().setTextAlign('justify').run()}>Justify</MenuItem>
        <MenuItem onClick={() => editor.chain().focus().toggleBulletList().run()}>Bullets</MenuItem>
        <MenuItem onClick={() => editor.chain().focus().toggleOrderedList().run()}>Numbered list</MenuItem>
        <MenuItem onClick={() => editor.chain().focus().toggleTaskList().run()}>Checklist</MenuItem>
        <MenuItem
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          shortcut="Ctrl+\"
        >
          Clear formatting
        </MenuItem>
      </Dropdown>
      <Dropdown label="Tools">
        <MenuItem onClick={() => chrome.openDialog('wordCount')}>Word count</MenuItem>
      </Dropdown>
    </nav>
  )
}
