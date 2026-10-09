import { Extension } from '@tiptap/core'

const BLOCK_TYPES = ['paragraph', 'heading']

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    paragraphSpacing: {
      setParagraphSpacing: (input: { spaceBefore?: number | null; spaceAfter?: number | null }) => ReturnType
    }
  }
}

export const ParagraphSpacing = Extension.create({
  name: 'paragraphSpacing',

  addGlobalAttributes() {
    return [
      {
        types: BLOCK_TYPES,
        attributes: {
          spaceBefore: {
            default: null,
            parseHTML: (element) => {
              const value = element.style.marginTop
              return value ? Number.parseFloat(value) : null
            },
            renderHTML: (attributes) =>
              attributes.spaceBefore != null ? { style: `margin-top: ${attributes.spaceBefore}pt` } : {},
          },
          spaceAfter: {
            default: null,
            parseHTML: (element) => {
              const value = element.style.marginBottom
              return value ? Number.parseFloat(value) : null
            },
            renderHTML: (attributes) =>
              attributes.spaceAfter != null ? { style: `margin-bottom: ${attributes.spaceAfter}pt` } : {},
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setParagraphSpacing:
        (input) =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection
          let changed = false
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!BLOCK_TYPES.includes(node.type.name)) return
            const spaceBefore =
              input.spaceBefore === undefined ? node.attrs.spaceBefore : input.spaceBefore
            const spaceAfter =
              input.spaceAfter === undefined ? node.attrs.spaceAfter : input.spaceAfter
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, spaceBefore, spaceAfter })
            changed = true
          })
          if (changed && dispatch) dispatch(tr)
          return changed
        },
    }
  },
})
