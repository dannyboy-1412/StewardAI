import { Extension } from '@tiptap/core'

const BLOCK_TYPES = ['paragraph', 'heading']

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight: (lineHeight: string) => ReturnType
      unsetLineHeight: () => ReturnType
    }
  }
}

export const LineHeight = Extension.create({
  name: 'lineHeight',

  addGlobalAttributes() {
    return [
      {
        types: BLOCK_TYPES,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => element.style.lineHeight || null,
            renderHTML: (attributes) =>
              attributes.lineHeight ? { style: `line-height: ${attributes.lineHeight}` } : {},
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setLineHeight:
        (lineHeight: string) =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection
          let changed = false
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!BLOCK_TYPES.includes(node.type.name)) return
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, lineHeight })
            changed = true
          })
          if (changed && dispatch) dispatch(tr)
          return changed
        },
      unsetLineHeight:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection
          let changed = false
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!BLOCK_TYPES.includes(node.type.name)) return
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, lineHeight: null })
            changed = true
          })
          if (changed && dispatch) dispatch(tr)
          return changed
        },
    }
  },
})
