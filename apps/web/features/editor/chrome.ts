import type { PageSettings } from '@docai/document'

export type EditorDialog =
  | 'link'
  | 'find'
  | 'pageSetup'
  | 'specialChars'
  | 'wordCount'
  | 'versions'

export type EditorChrome = {
  documentId: string
  title: string
  zoom: number
  setZoom: (zoom: number) => void
  showOutline: boolean
  setShowOutline: (show: boolean) => void
  showAiPanel: boolean
  setShowAiPanel: (show: boolean) => void
  paintArmed: boolean
  armPaint: () => void
  openDialog: (dialog: EditorDialog) => void
  print: () => void
  exportFile: (format: 'docx' | 'md' | 'txt' | 'html') => void
  importFile: () => void
  makeCopy: () => void
  newDocument: () => void
  openDocuments: () => void
  insertImage: () => void
  onUndo: () => void
  onRedo: () => void
  starred: boolean
  toggleStar: () => void
  pageSettings: PageSettings
}
