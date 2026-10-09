import mammoth from 'mammoth'
import { parseHTML } from 'linkedom'
import { generateJSON } from '@tiptap/html'
import {
  assignMissingIds,
  ensureDoc,
  markdownToNodes,
  paragraph,
  setTopLevelBlocks,
  type JSONContent,
} from '@docai/document'
import { createEditorExtensions } from '@docai/document/extensions'

const extensions = createEditorExtensions({ history: false, uniqueId: true })

function withIds(doc: JSONContent): JSONContent {
  return ensureDoc({
    ...doc,
    content: (doc.content ?? []).map(assignMissingIds),
  })
}

function jsonFromHtml(html: string): JSONContent {
  const { window } = parseHTML(`<!DOCTYPE html><html><body>${html}</body></html>`)
  const previousWindow = (globalThis as { window?: unknown }).window
  const previousDocument = (globalThis as { document?: unknown }).document
  ;(globalThis as { window?: unknown }).window = window
  ;(globalThis as { document?: unknown }).document = window.document
  try {
    return withIds(ensureDoc(generateJSON(html, extensions)))
  } finally {
    ;(globalThis as { window?: unknown }).window = previousWindow
    ;(globalThis as { document?: unknown }).document = previousDocument
  }
}

export async function importDocumentFile(input: {
  buffer: Buffer
  filename: string
  mimeType: string
}): Promise<{ title: string; contentJson: JSONContent }> {
  const lower = input.filename.toLowerCase()
  const title = input.filename.replace(/\.[^.]+$/, '') || 'Imported document'

  if (lower.endsWith('.md') || input.mimeType === 'text/markdown') {
    const markdown = input.buffer.toString('utf8')
    return {
      title,
      contentJson: withIds(setTopLevelBlocks({ type: 'doc' }, markdownToNodes(markdown))),
    }
  }

  if (lower.endsWith('.txt') || input.mimeType === 'text/plain') {
    const text = input.buffer.toString('utf8')
    const blocks = text
      .split(/\n{2,}/)
      .map((part) => paragraph(part.trim()))
      .filter((block) => (block.content?.length ?? 0) > 0)
    return {
      title,
      contentJson: withIds(setTopLevelBlocks({ type: 'doc' }, blocks.length ? blocks : [paragraph('')])),
    }
  }

  if (lower.endsWith('.html') || input.mimeType === 'text/html') {
    return { title, contentJson: jsonFromHtml(input.buffer.toString('utf8')) }
  }

  if (
    lower.endsWith('.docx') ||
    input.mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.convertToHtml({ buffer: input.buffer })
    return { title, contentJson: jsonFromHtml(result.value) }
  }

  throw new Error('Unsupported import type. Use .docx, .md, .txt, or .html')
}
