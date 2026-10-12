import { Node, Mark } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import TextAlign from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import UniqueID from '@tiptap/extension-unique-id'
import FontFamily from '@tiptap/extension-font-family'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CharacterCount from '@tiptap/extension-character-count'
import Typography from '@tiptap/extension-typography'
import { BLOCK_TYPES_WITH_ID } from './types.js'
import { FontSize } from './extensions/fontSize.js'
import { LineHeight } from './extensions/lineHeight.js'
import { ParagraphSpacing } from './extensions/paragraphSpacing.js'
import { Indent } from './extensions/indent.js'
import { ParagraphStyle } from './extensions/paragraphStyle.js'
import { PageBreak } from './extensions/pageBreak.js'
import { TableOfContents } from './extensions/tableOfContents.js'
import { ResizableImage } from './extensions/resizableImage.js'
import { ReferenceAttrs } from './extensions/referenceAttrs.js'

export { FontSize } from './extensions/fontSize.js'
export { LineHeight } from './extensions/lineHeight.js'
export { ParagraphSpacing } from './extensions/paragraphSpacing.js'
export { Indent } from './extensions/indent.js'
export { ParagraphStyle } from './extensions/paragraphStyle.js'
export { PageBreak } from './extensions/pageBreak.js'
export { TableOfContents } from './extensions/tableOfContents.js'
export { ResizableImage } from './extensions/resizableImage.js'
export { ReferenceAttrs } from './extensions/referenceAttrs.js'

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

export function createEditorExtensions(options?: {
  placeholder?: string
  history?: boolean
  uniqueId?: boolean
  resolveImageSrc?: (src: string) => Promise<string>
}) {
  return [
    StarterKit.configure({
      history: options?.history === false ? false : undefined,
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      codeBlock: { languageClassPrefix: 'language-' },
    }),
    Underline,
    Link.configure({ openOnClick: false, autolink: true }),
    ResizableImage.configure({
      inline: false,
      allowBase64: false,
      resolveSrc: options?.resolveImageSrc,
    }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({ nested: true }),
    TextAlign.configure({ types: ['heading', 'paragraph', 'listItem', 'taskItem', 'image'] }),
    TextStyle,
    FontFamily,
    FontSize,
    Color,
    Highlight.configure({ multicolor: true }),
    Subscript,
    Superscript,
    Typography,
    CharacterCount,
    LineHeight,
    ParagraphSpacing,
    Indent,
    ParagraphStyle,
    PageBreak,
    TableOfContents,
    Placeholder.configure({
      placeholder: options?.placeholder ?? 'Start writing, or ask AI to draft this page…',
    }),
    Equation,
    Citation,
    ReferenceAttrs,
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
