import { Extension } from '@tiptap/core'
import { stepFontSize } from './fonts'

type ShortcutOptions = {
  onFind: () => void
  onLink: () => void
}

export const DocsShortcuts = Extension.create<ShortcutOptions>({
  name: 'docsShortcuts',
  addOptions() {
    return { onFind: () => undefined, onLink: () => undefined }
  },
  addKeyboardShortcuts() {
    return {
      'Mod-Alt-1': () => this.editor.chain().focus().toggleHeading({ level: 1 }).run(),
      'Mod-Alt-2': () => this.editor.chain().focus().toggleHeading({ level: 2 }).run(),
      'Mod-Alt-3': () => this.editor.chain().focus().toggleHeading({ level: 3 }).run(),
      'Mod-Alt-4': () => this.editor.chain().focus().toggleHeading({ level: 4 }).run(),
      'Mod-Alt-5': () => this.editor.chain().focus().toggleHeading({ level: 5 }).run(),
      'Mod-Alt-6': () => this.editor.chain().focus().toggleHeading({ level: 6 }).run(),
      'Mod-Shift-7': () => this.editor.chain().focus().toggleOrderedList().run(),
      'Mod-Shift-8': () => this.editor.chain().focus().toggleBulletList().run(),
      'Mod-Shift-9': () => this.editor.chain().focus().toggleTaskList().run(),
      'Mod-\\': () => this.editor.chain().focus().unsetAllMarks().clearNodes().run(),
      'Mod-h': () => {
        this.options.onFind()
        return true
      },
      'Mod-Enter': () => this.editor.chain().focus().insertPageBreak().run(),
      'Mod-k': () => {
        this.options.onLink()
        return true
      },
      'Mod-Shift-.': () => {
        const current = String(this.editor.getAttributes('textStyle').fontSize ?? '11pt')
        return this.editor.chain().focus().setFontSize(stepFontSize(current, 1)).run()
      },
      'Mod-Shift-,': () => {
        const current = String(this.editor.getAttributes('textStyle').fontSize ?? '11pt')
        return this.editor.chain().focus().setFontSize(stepFontSize(current, -1)).run()
      },
      'Mod-Shift-l': () => this.editor.chain().focus().setTextAlign('left').run(),
      'Mod-Shift-e': () => this.editor.chain().focus().setTextAlign('center').run(),
      'Mod-Shift-r': () => this.editor.chain().focus().setTextAlign('right').run(),
      'Mod-Shift-j': () => this.editor.chain().focus().setTextAlign('justify').run(),
    }
  },
})
