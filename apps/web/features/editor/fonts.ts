export type DocumentFont = {
  id: string
  css: string
  source: 'system' | 'google'
  google?: string
}

export const DOCUMENT_FONTS: DocumentFont[] = [
  { id: 'Arial', css: 'Arial, Helvetica, sans-serif', source: 'system' },
  { id: 'Times New Roman', css: '"Times New Roman", Times, serif', source: 'system' },
  { id: 'Georgia', css: 'Georgia, serif', source: 'system' },
  { id: 'Verdana', css: 'Verdana, Geneva, sans-serif', source: 'system' },
  { id: 'Courier New', css: '"Courier New", Courier, monospace', source: 'system' },
  { id: 'Trebuchet MS', css: '"Trebuchet MS", sans-serif', source: 'system' },
  { id: 'Comic Sans MS', css: '"Comic Sans MS", cursive', source: 'system' },
  { id: 'Roboto', css: 'Roboto, sans-serif', source: 'google', google: 'Roboto:ital,wght@0,400;0,700;1,400;1,700' },
  { id: 'Open Sans', css: '"Open Sans", sans-serif', source: 'google', google: 'Open+Sans:ital,wght@0,400;0,700;1,400' },
  { id: 'Lato', css: 'Lato, sans-serif', source: 'google', google: 'Lato:ital,wght@0,400;0,700;1,400' },
  { id: 'Montserrat', css: 'Montserrat, sans-serif', source: 'google', google: 'Montserrat:ital,wght@0,400;0,700;1,400' },
  { id: 'Merriweather', css: 'Merriweather, serif', source: 'google', google: 'Merriweather:ital,wght@0,400;0,700;1,400' },
  { id: 'Playfair Display', css: '"Playfair Display", serif', source: 'google', google: 'Playfair+Display:ital,wght@0,400;0,700;1,400' },
  { id: 'Inter', css: 'Inter, sans-serif', source: 'google', google: 'Inter:ital,wght@0,400;0,700;1,400' },
]

export const FONT_SIZES_PT = [8, 9, 10, 11, 12, 14, 18, 24, 36, 48, 60, 72]

export const DEFAULT_EDITOR_FONT = 'Arial'
export const DEFAULT_EDITOR_FONT_SIZE = '11pt'

const loaded = new Set<string>()

export function fontCss(id: string): string {
  return DOCUMENT_FONTS.find((font) => font.id === id)?.css ?? id
}

export function ensureFontLoaded(id: string) {
  const font = DOCUMENT_FONTS.find((item) => item.id === id)
  if (!font || font.source !== 'google' || !font.google || loaded.has(id)) return
  loaded.add(id)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`
  document.head.append(link)
}

export function loadFontsFromContent(json: unknown) {
  const used = new Set<string>()
  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    const record = node as { marks?: { type?: string; attrs?: { fontFamily?: string } }[]; content?: unknown[] }
    for (const mark of record.marks ?? []) {
      if (mark.type === 'textStyle' && mark.attrs?.fontFamily) used.add(mark.attrs.fontFamily)
    }
    for (const child of record.content ?? []) visit(child)
  }
  visit(json)
  for (const id of used) ensureFontLoaded(id)
}

export function stepFontSize(current: string, direction: 1 | -1): string {
  const value = Number.parseFloat(current) || 11
  const index = FONT_SIZES_PT.findIndex((size) => size >= value)
  const at = index === -1 ? FONT_SIZES_PT.length - 1 : index
  const next = FONT_SIZES_PT[Math.max(0, Math.min(FONT_SIZES_PT.length - 1, at + direction))] ?? 11
  return `${next}pt`
}
