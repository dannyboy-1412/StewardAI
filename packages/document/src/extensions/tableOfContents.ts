import { Node, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tableOfContents: {
      insertTableOfContents: () => ReturnType
    }
  }
}

type HeadingEntry = {
  id: string
  level: number
  text: string
}

function collectHeadings(editor: { state: { doc: { descendants: (fn: (node: { type: { name: string }; attrs: Record<string, unknown>; textContent: string }) => void) => void } } }): HeadingEntry[] {
  const headings: HeadingEntry[] = []
  editor.state.doc.descendants((node) => {
    if (node.type.name !== 'heading') return
    const id = typeof node.attrs.id === 'string' ? node.attrs.id : ''
    headings.push({
      id,
      level: Number(node.attrs.level ?? 1),
      text: node.textContent,
    })
  })
  return headings
}

function renderList(dom: HTMLElement, headings: HeadingEntry[], onJump: (id: string) => void) {
  dom.replaceChildren()
  const title = document.createElement('p')
  title.className = 'toc-title'
  title.textContent = 'Table of contents'
  dom.append(title)
  if (headings.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'toc-empty'
    empty.textContent = 'Headings in this document will appear here.'
    dom.append(empty)
    return
  }
  const list = document.createElement('ul')
  for (const heading of headings) {
    const item = document.createElement('li')
    item.dataset.level = String(heading.level)
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = heading.text || `Heading ${heading.level}`
    button.addEventListener('click', () => {
      if (heading.id) onJump(heading.id)
    })
    item.append(button)
    list.append(item)
  }
  dom.append(list)
}

export const TableOfContents = Node.create({
  name: 'tableOfContents',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      id: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'nav[data-table-of-contents]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'nav',
      mergeAttributes(HTMLAttributes, {
        'data-table-of-contents': '',
        class: 'table-of-contents',
      }),
      ['p', { class: 'toc-title' }, 'Table of contents'],
    ]
  },

  addNodeView() {
    return ({ editor }) => {
      if (typeof document === 'undefined') {
        return {
          dom: {
            nodeName: 'NAV',
            setAttribute() {},
            appendChild() {},
            replaceChildren() {},
          } as unknown as HTMLElement,
        }
      }
      const dom = document.createElement('nav')
      dom.setAttribute('data-table-of-contents', '')
      dom.className = 'table-of-contents'
      const jump = (id: string) => {
        const target = editor.view.dom.querySelector(`[data-id="${id}"], [id="${id}"]`)
        if (target instanceof HTMLElement) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      const refresh = () => renderList(dom, collectHeadings(editor), jump)
      refresh()
      editor.on('update', refresh)
      return {
        dom,
        ignoreMutation: () => true,
        destroy() {
          editor.off('update', refresh)
        },
      }
    }
  },

  addCommands() {
    return {
      insertTableOfContents:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name }),
    }
  },
})
