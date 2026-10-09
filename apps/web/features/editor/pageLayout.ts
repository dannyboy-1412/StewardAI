import { PaginationPlus, PAGE_SIZES } from 'tiptap-pagination-plus'
import { DEFAULT_PAGE_SETTINGS, type PageSettings } from '@docai/document'

const INCH_PX = 96
const PAGE_GAP_PX = 28
const CANVAS_BACKGROUND = '#e8efe6'
const PAGE_OUTLINE = '#d3e0d4'

const LETTER = {
  pageWidth: Math.round(8.5 * INCH_PX),
  pageHeight: Math.round(11 * INCH_PX),
}

function paperBox(settings: PageSettings) {
  const base = settings.paperSize === 'Letter' ? LETTER : PAGE_SIZES.A4
  if (settings.orientation === 'landscape') {
    return { pageWidth: base.pageHeight, pageHeight: base.pageWidth }
  }
  return { pageWidth: base.pageWidth, pageHeight: base.pageHeight }
}

export function pageDimensions(settings: PageSettings = DEFAULT_PAGE_SETTINGS) {
  return paperBox(settings)
}

export const PAGE_WIDTH_PX = paperBox(DEFAULT_PAGE_SETTINGS).pageWidth

export function createPageLayoutExtension(settings: PageSettings = DEFAULT_PAGE_SETTINGS) {
  const { pageWidth, pageHeight } = paperBox(settings)
  return PaginationPlus.configure({
    pageHeight,
    pageWidth,
    marginTop: settings.marginTop * INCH_PX,
    marginBottom: settings.marginBottom * INCH_PX,
    marginLeft: settings.marginLeft * INCH_PX,
    marginRight: settings.marginRight * INCH_PX,
    pageGap: PAGE_GAP_PX,
    pageGapBorderSize: 1,
    pageGapBorderColor: PAGE_OUTLINE,
    pageBreakBackground: CANVAS_BACKGROUND,
    contentMarginTop: 8,
    contentMarginBottom: 8,
    footerRight: settings.showPageNumbers ? '{page}' : '',
    footerLeft: settings.footerText,
    headerRight: '',
    headerLeft: settings.headerText,
  })
}

export const pageLayoutExtension = createPageLayoutExtension()
