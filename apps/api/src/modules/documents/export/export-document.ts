import {
  docToHtml,
  mergePageSettings,
  nodesToMarkdown,
  textOf,
  topLevelBlocks,
  type JSONContent,
  type PageSettings,
} from '@docai/document'
import { jsonToDocxBuffer } from './json-to-docx.js'

export type ExportFormat = 'docx' | 'md' | 'txt' | 'html'

export function isExportFormat(value: string): value is ExportFormat {
  return value === 'docx' || value === 'md' || value === 'txt' || value === 'html'
}

function htmlDocument(title: string, body: string, settings: PageSettings): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.15; color: #1b2b24; max-width: 800px; margin: 2rem auto; }
    img { max-width: 100%; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 0.4rem 0.6rem; }
  </style>
</head>
<body style="background:${escapeHtml(settings.pageColor)}">${body}</body>
</html>`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export async function exportDocument(input: {
  title: string
  contentJson: JSONContent
  pageSettings: PageSettings | unknown
  format: ExportFormat
}): Promise<{ body: Buffer; mime: string; filename: string }> {
  const settings = mergePageSettings(input.pageSettings)
  const safeTitle = input.title.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'document'

  if (input.format === 'md') {
    const markdown = nodesToMarkdown(topLevelBlocks(input.contentJson))
    return {
      body: Buffer.from(markdown, 'utf8'),
      mime: 'text/markdown; charset=utf-8',
      filename: `${safeTitle}.md`,
    }
  }
  if (input.format === 'txt') {
    const text = textOf(input.contentJson)
    return {
      body: Buffer.from(text, 'utf8'),
      mime: 'text/plain; charset=utf-8',
      filename: `${safeTitle}.txt`,
    }
  }
  if (input.format === 'html') {
    const body = docToHtml(input.contentJson)
    return {
      body: Buffer.from(htmlDocument(input.title, body, settings), 'utf8'),
      mime: 'text/html; charset=utf-8',
      filename: `${safeTitle}.html`,
    }
  }
  const docx = await jsonToDocxBuffer(input.contentJson, settings, input.title)
  return {
    body: docx,
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    filename: `${safeTitle}.docx`,
  }
}
