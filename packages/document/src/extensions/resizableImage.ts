import Image, { type ImageOptions } from '@tiptap/extension-image'
import type { Editor } from '@tiptap/core'

function applyAlign(wrap: HTMLElement, align: string | null) {
  wrap.dataset.align = align ?? 'left'
  wrap.style.textAlign = align === 'center' || align === 'right' ? align : 'left'
}

function updateWidth(editor: Editor, getPos: () => number | undefined, width: number) {
  const pos = getPos()
  if (typeof pos !== 'number') return
  const node = editor.state.doc.nodeAt(pos)
  if (!node) return
  editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, width }))
}

type ResolveSrc = (src: string) => Promise<string>

type ResizableImageOptions = ImageOptions & {
  resolveSrc?: ResolveSrc
}

export const ResizableImage = Image.extend<ResizableImageOptions>({
  addOptions() {
    return {
      ...this.parent?.(),
      resolveSrc: undefined,
    }
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute('width') || element.style.width || null,
        renderHTML: (attributes) => (attributes.width ? { width: attributes.width } : {}),
      },
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute('height') || element.style.height || null,
        renderHTML: (attributes) => (attributes.height ? { height: attributes.height } : {}),
      },
    }
  },

  addNodeView() {
    const resolveSrc = this.options.resolveSrc
    return ({ node, editor, getPos }) => {
      if (typeof document === 'undefined') {
        return {
          dom: {
            nodeName: 'DIV',
            setAttribute() {},
            appendChild() {},
          } as unknown as HTMLElement,
        }
      }

      const wrap = document.createElement('div')
      wrap.className = 'image-block'
      wrap.style.position = 'relative'
      wrap.style.display = 'block'
      applyAlign(wrap, node.attrs.textAlign ?? null)

      const img = document.createElement('img')
      img.alt = node.attrs.alt ?? ''
      img.draggable = false
      if (node.attrs.width) img.style.width = `${node.attrs.width}px`
      img.style.maxWidth = '100%'
      img.style.height = 'auto'

      let generation = 0
      let blobUrl: string | null = null
      let currentSrc = ''

      const setSrc = (src: string) => {
        if (src === currentSrc) return
        currentSrc = src
        if (!resolveSrc) {
          img.src = src
          return
        }
        const current = ++generation
        void resolveSrc(src)
          .then((next) => {
            if (current !== generation) {
              if (next.startsWith('blob:')) URL.revokeObjectURL(next)
              return
            }
            if (blobUrl) URL.revokeObjectURL(blobUrl)
            blobUrl = next.startsWith('blob:') ? next : null
            img.src = next
          })
          .catch(() => {
            if (current === generation) img.src = src
          })
      }

      setSrc(typeof node.attrs.src === 'string' ? node.attrs.src : '')

      const handle = document.createElement('span')
      handle.className = 'image-resize-handle'
      handle.style.display = 'none'

      let startX = 0
      let startWidth = 0
      const onMove = (event: MouseEvent) => {
        const delta = event.clientX - startX
        const next = Math.max(80, startWidth + delta)
        img.style.width = `${next}px`
      }
      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        const width = Number.parseInt(img.style.width, 10)
        if (Number.isFinite(width)) {
          updateWidth(editor, () => (typeof getPos === 'function' ? getPos() : undefined), width)
        }
      }
      handle.addEventListener('mousedown', (event) => {
        event.preventDefault()
        event.stopPropagation()
        startX = event.clientX
        startWidth = img.getBoundingClientRect().width
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
      })

      wrap.append(img, handle)
      return {
        dom: wrap,
        update(updated) {
          if (updated.type.name !== 'image') return false
          setSrc(typeof updated.attrs.src === 'string' ? updated.attrs.src : '')
          img.alt = updated.attrs.alt ?? ''
          if (updated.attrs.width) img.style.width = `${updated.attrs.width}px`
          applyAlign(wrap, updated.attrs.textAlign ?? null)
          return true
        },
        selectNode() {
          wrap.classList.add('is-selected')
          handle.style.display = 'block'
        },
        deselectNode() {
          wrap.classList.remove('is-selected')
          handle.style.display = 'none'
        },
        destroy() {
          generation += 1
          if (blobUrl) URL.revokeObjectURL(blobUrl)
          blobUrl = null
          window.removeEventListener('mousemove', onMove)
          window.removeEventListener('mouseup', onUp)
        },
      }
    }
  },
})
