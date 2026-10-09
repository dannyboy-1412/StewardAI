export const DEFAULT_FONT_FAMILY = 'Arial'
export const DEFAULT_FONT_SIZE = '11pt'
export const DEFAULT_LINE_HEIGHT = '1.15'
export const INDENT_STEP_PX = 36
export const MAX_INDENT = 8
export const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const

export type HeadingLevel = (typeof HEADING_LEVELS)[number]
export type ParagraphStyleName = 'title' | 'subtitle'
