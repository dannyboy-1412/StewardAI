import { Extension, Node, Mark } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import TextAlign from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import UniqueID from '@tiptap/extension-unique-id'
import { BLOCK_TYPES_WITH_ID } from './types.js'

export const Equation = Node.create({
  name: 'equation',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      id: { default: null },
      latex: { default: '' },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-equation]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      {
        'data-equation': '',
        'data-latex': HTMLAttributes.latex,
        class: 'equation-block',
      },
      HTMLAttributes.latex || 'equation',
    ]
  },
})

export const Citation = Mark.create({
  name: 'citation',
  addAttributes() {
    return {
      citationId: { default: null },
      title: { default: null },
    }
  },
  parseHTML() {
    return [{ tag: 'span[data-citation]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', { 'data-citation': '', ...HTMLAttributes }, 0]
  },
})

export const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) =>
              attributes.fontSize ? { style: `font-size: ${attributes.fontSize}` } : {},
          },
        },
      },
    ]
  },
})

export function createEditorExtensions(options?: {
  placeholder?: string
  history?: boolean
  uniqueId?: boolean
}) {
  return [
    StarterKit.configure({
      history: options?.history === false ? false : undefined,
      heading: { levels: [1, 2, 3] },
      codeBlock: { languageClassPrefix: 'language-' },
    }),
    Underline,
    Link.configure({ openOnClick: false, autolink: true }),
    Image.configure({ inline: false, allowBase64: false }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TextStyle,
    Color,
    Highlight,
    FontSize,
    Placeholder.configure({
      placeholder: options?.placeholder ?? 'Start writing, or ask AI to draft this page…',
    }),
    Equation,
    Citation,
    ...(options?.uniqueId === false
      ? []
      : [
          UniqueID.configure({
            attributeName: 'id',
            types: [...BLOCK_TYPES_WITH_ID],
          }),
        ]),
  ]
}
