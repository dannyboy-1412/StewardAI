import type { JSONContent, JSONMark } from './types.js'

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function styleFromMarks(marks: JSONMark[] | undefined): string {
  const textStyle = marks?.find((mark) => mark.type === 'textStyle')?.attrs
  const parts: string[] = []
  if (typeof textStyle?.fontFamily === 'string') parts.push(`font-family:${textStyle.fontFamily}`)
  if (typeof textStyle?.fontSize === 'string') parts.push(`font-size:${textStyle.fontSize}`)
  if (typeof textStyle?.color === 'string') parts.push(`color:${textStyle.color}`)
  return parts.join(';')
}

function wrapMarks(text: string, marks: JSONMark[] | undefined): string {
  let html = escapeHtml(text)
  const style = styleFromMarks(marks)
  if (style) html = `<span style="${style}">${html}</span>`
  for (const mark of marks ?? []) {
    if (mark.type === 'bold') html = `<strong>${html}</strong>`
    if (mark.type === 'italic') html = `<em>${html}</em>`
    if (mark.type === 'underline') html = `<u>${html}</u>`
    if (mark.type === 'strike') html = `<s>${html}</s>`
    if (mark.type === 'code') html = `<code>${html}</code>`
    if (mark.type === 'subscript') html = `<sub>${html}</sub>`
    if (mark.type === 'superscript') html = `<sup>${html}</sup>`
    if (mark.type === 'highlight') {
      const color = typeof mark.attrs?.color === 'string' ? mark.attrs.color : '#ffff00'
      html = `<mark style="background:${color}">${html}</mark>`
    }
    if (mark.type === 'link') {
      const href = typeof mark.attrs?.href === 'string' ? mark.attrs.href : ''
      html = `<a href="${escapeHtml(href)}">${html}</a>`
    }
  }
  return html
}

function inlineHtml(node: JSONContent): string {
  if (node.type === 'hardBreak') return '<br />'
  if (node.text !== undefined) return wrapMarks(node.text, node.marks)
  return (node.content ?? []).map(inlineHtml).join('')
}

function blockStyle(node: JSONContent): string {
  const parts: string[] = []
  if (typeof node.attrs?.textAlign === 'string') parts.push(`text-align:${node.attrs.textAlign}`)
  if (typeof node.attrs?.lineHeight === 'string') parts.push(`line-height:${node.attrs.lineHeight}`)
  if (typeof node.attrs?.indent === 'number' && node.attrs.indent > 0) {
    parts.push(`margin-left:${node.attrs.indent * 36}px`)
  }
  return parts.join(';')
}

function attr(style: string): string {
  return style ? ` style="${style}"` : ''
}

function nodeToHtml(node: JSONContent): string {
  const style = blockStyle(node)
  switch (node.type) {
    case 'heading': {
      const level = Math.min(Math.max(Number(node.attrs?.level ?? 1), 1), 6)
      return `<h${level}${attr(style)}>${inlineHtml(node)}</h${level}>`
    }
    case 'paragraph':
      return `<p${attr(style)}>${inlineHtml(node)}</p>`
    case 'blockquote':
      return `<blockquote>${(node.content ?? []).map(nodeToHtml).join('')}</blockquote>`
    case 'codeBlock':
      return `<pre><code>${escapeHtml(inlineHtml(node))}</code></pre>`
    case 'bulletList':
      return `<ul>${(node.content ?? []).map((item) => `<li>${(item.content ?? []).map(nodeToHtml).join('')}</li>`).join('')}</ul>`
    case 'orderedList':
      return `<ol>${(node.content ?? []).map((item) => `<li>${(item.content ?? []).map(nodeToHtml).join('')}</li>`).join('')}</ol>`
    case 'taskList':
      return `<ul>${(node.content ?? [])
        .map(
          (item) =>
            `<li><input type="checkbox"${item.attrs?.checked ? ' checked' : ''} /> ${(item.content ?? []).map(nodeToHtml).join('')}</li>`,
        )
        .join('')}</ul>`
    case 'table':
      return `<table>${(node.content ?? [])
        .map(
          (row) =>
            `<tr>${(row.content ?? [])
              .map((cell) => {
                const tag = cell.type === 'tableHeader' ? 'th' : 'td'
                return `<${tag}>${(cell.content ?? []).map(nodeToHtml).join('')}</${tag}>`
              })
              .join('')}</tr>`,
        )
        .join('')}</table>`
    case 'horizontalRule':
      return '<hr />'
    case 'pageBreak':
      return '<div data-page-break class="page-break"></div>'
    case 'tableOfContents':
      return '<nav data-table-of-contents>Table of contents</nav>'
    case 'image':
      return `<img src="${escapeHtml(String(node.attrs?.src ?? ''))}" alt="${escapeHtml(String(node.attrs?.alt ?? ''))}" />`
    case 'equation':
      return `<div data-equation>${escapeHtml(String(node.attrs?.latex ?? ''))}</div>`
    default:
      return inlineHtml(node)
  }
}

export function nodesToHtml(nodes: JSONContent[]): string {
  return nodes.map(nodeToHtml).join('')
}

export function docToHtml(doc: JSONContent): string {
  return nodesToHtml(doc.content ?? [])
}
