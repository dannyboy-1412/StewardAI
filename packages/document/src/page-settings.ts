export const PAPER_SIZES = ['A4', 'Letter'] as const
export const PAGE_ORIENTATIONS = ['portrait', 'landscape'] as const

export type PaperSize = (typeof PAPER_SIZES)[number]
export type PageOrientation = (typeof PAGE_ORIENTATIONS)[number]

export type PageSettings = {
  paperSize: PaperSize
  orientation: PageOrientation
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number
  pageColor: string
  headerText: string
  footerText: string
  showPageNumbers: boolean
}

export const DEFAULT_PAGE_SETTINGS: PageSettings = {
  paperSize: 'A4',
  orientation: 'portrait',
  marginTop: 1,
  marginBottom: 1,
  marginLeft: 1,
  marginRight: 1,
  pageColor: '#ffffff',
  headerText: '',
  footerText: '',
  showPageNumbers: true,
}

export function mergePageSettings(value: unknown): PageSettings {
  if (!value || typeof value !== 'object') return { ...DEFAULT_PAGE_SETTINGS }
  const input = value as Partial<PageSettings>
  return {
    paperSize: input.paperSize === 'Letter' ? 'Letter' : 'A4',
    orientation: input.orientation === 'landscape' ? 'landscape' : 'portrait',
    marginTop: typeof input.marginTop === 'number' ? input.marginTop : DEFAULT_PAGE_SETTINGS.marginTop,
    marginBottom:
      typeof input.marginBottom === 'number' ? input.marginBottom : DEFAULT_PAGE_SETTINGS.marginBottom,
    marginLeft:
      typeof input.marginLeft === 'number' ? input.marginLeft : DEFAULT_PAGE_SETTINGS.marginLeft,
    marginRight:
      typeof input.marginRight === 'number' ? input.marginRight : DEFAULT_PAGE_SETTINGS.marginRight,
    pageColor: typeof input.pageColor === 'string' ? input.pageColor : DEFAULT_PAGE_SETTINGS.pageColor,
    headerText: typeof input.headerText === 'string' ? input.headerText : DEFAULT_PAGE_SETTINGS.headerText,
    footerText: typeof input.footerText === 'string' ? input.footerText : DEFAULT_PAGE_SETTINGS.footerText,
    showPageNumbers:
      typeof input.showPageNumbers === 'boolean'
        ? input.showPageNumbers
        : DEFAULT_PAGE_SETTINGS.showPageNumbers,
  }
}
