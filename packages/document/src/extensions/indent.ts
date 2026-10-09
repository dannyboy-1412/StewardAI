import { Extension } from '@tiptap/core'
import { INDENT_STEP_PX, MAX_INDENT } from '../defaults.js'

const BLOCK_TYPES = ['paragraph', 'heading']

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      increaseIndent: () => ReturnType
      decreaseIndent: () => ReturnType
      setIndent: (indent: number) => ReturnType
    }
  }
}

function clampIndent(value: number): number {
  return Math.max(0, Math.min(MAX_INDENT, value))
}

export const Indent = Extension.create({
  name: 'indent',

  addGlobalAttributes() {
    return [
      {
        types: BLOCK_TYPES,
        attributes: {
          indent: {
            default: null,
            parseHTML: (element) => {
              const value = element.style.marginLeft
              if (!value) return null
              const px = Number.parseFloat(value)
              if (!Number.isFinite(px) || px <= 0) return null
              return clampIndent(Math.round(px / INDENT_STEP_PX))
            },
            renderHTML: (attributes) =>
              attributes.indent
                ? { style: `margin-left: ${Number(attributes.indent) * INDENT_STEP_PX}px` }
                : {},
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      increaseIndent:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection
          let changed = false
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!BLOCK_TYPES.includes(node.type.name)) return
            const current = Number(node.attrs.indent ?? 0)
            const next = clampIndent(current + 1)
            if (next === current) return
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next || null })
            changed = true
          })
          if (changed && dispatch) dispatch(tr)
          return changed
        },
      decreaseIndent:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection
          let changed = false
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!BLOCK_TYPES.includes(node.type.name)) return
            const current = Number(node.attrs.indent ?? 0)
            const next = clampIndent(current - 1)
            if (next === current) return
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next || null })
            changed = true
          })
          if (changed && dispatch) dispatch(tr)
          return changed
        },
      setIndent:
        (indent: number) =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection
          let changed = false
          const next = clampIndent(indent) || null
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!BLOCK_TYPES.includes(node.type.name)) return
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next })
            changed = true
          })
          if (changed && dispatch) dispatch(tr)
          return changed
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (
          this.editor.isActive('listItem') ||
          this.editor.isActive('taskItem') ||
          this.editor.isActive('codeBlock')
        ) {
          return false
        }
        return this.editor.commands.increaseIndent()
      },
      'Shift-Tab': () => {
        if (
          this.editor.isActive('listItem') ||
          this.editor.isActive('taskItem') ||
          this.editor.isActive('codeBlock')
        ) {
          return false
        }
        return this.editor.commands.decreaseIndent()
      },
    }
  },
})
