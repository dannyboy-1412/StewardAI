import { Extension } from '@tiptap/core'
import type { ParagraphStyleName } from '../defaults.js'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    paragraphStyle: {
      setParagraphStyle: (styleName: ParagraphStyleName | null) => ReturnType
    }
  }
}

export const ParagraphStyle = Extension.create({
  name: 'paragraphStyle',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph'],
        attributes: {
          styleName: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-style-name') || null,
            renderHTML: (attributes) =>
              attributes.styleName
                ? {
                    'data-style-name': attributes.styleName,
                    class: `paragraph-style-${attributes.styleName}`,
                  }
                : {},
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setParagraphStyle:
        (styleName) =>
        ({ commands, chain }) => {
          if (styleName === 'title' || styleName === 'subtitle') {
            return chain().setParagraph().updateAttributes('paragraph', { styleName }).run()
          }
          return commands.updateAttributes('paragraph', { styleName: null })
        },
    }
  },
})
