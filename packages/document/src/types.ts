export type JSONMark = {
  type: string
  attrs?: Record<string, unknown>
}

export type JSONContent = {
  type: string
  attrs?: Record<string, unknown>
  content?: JSONContent[]
  marks?: JSONMark[]
  text?: string
}

export type BlockType =
  | 'paragraph'
  | 'heading'
  | 'blockquote'
  | 'codeBlock'
  | 'bulletList'
  | 'orderedList'
  | 'taskList'
  | 'table'
  | 'horizontalRule'
  | 'image'
  | 'equation'
  | 'pageBreak'
  | 'tableOfContents'

export const BLOCK_TYPES_WITH_ID: readonly string[] = [
  'paragraph',
  'heading',
  'blockquote',
  'codeBlock',
  'bulletList',
  'orderedList',
  'taskList',
  'table',
  'horizontalRule',
  'image',
  'equation',
  'pageBreak',
  'tableOfContents',
]

export type CitationSource = {
  id: string
  title: string
  authors?: string
  year?: string
  url?: string
  publisher?: string
}
