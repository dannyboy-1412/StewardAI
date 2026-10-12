import { heading, paragraph, tableNode, type JSONContent } from '@docai/document'
import type { AiRunRecord } from '../documents/documents.service.js'

function changeSummary(changes: unknown[]): string {
  if (!Array.isArray(changes) || changes.length === 0) return 'No recorded changes'
  return changes
    .map((change) => {
      if (!change || typeof change !== 'object') return String(change)
      const record = change as {
        kind?: string
        reason?: string
        beforeMarkdown?: string
        afterMarkdown?: string
      }
      return [
        record.kind,
        record.reason,
        record.beforeMarkdown ? `before: ${record.beforeMarkdown}` : '',
        record.afterMarkdown ? `after: ${record.afterMarkdown}` : '',
      ]
        .filter(Boolean)
        .join(' — ')
    })
    .join('\n')
}

export function aiLogAppendix(runs: AiRunRecord[]): JSONContent {
  const content: JSONContent[] = [
    heading('AI use log', 1),
    paragraph('This appendix lists prompts, outputs, and edits made with PenPal AI.'),
  ]

  if (runs.length === 0) {
    content.push(paragraph('No AI runs were recorded for this document.'))
    return { type: 'doc', content }
  }

  for (const run of runs) {
    const when = new Date(run.createdAt).toISOString()
    content.push(
      tableNode(
        ['Field', 'Value'],
        [
          ['Time', when],
          ['Model', run.model],
          ['Prompt', run.prompt],
          ['Response', run.responseText ?? ''],
          ['Outcome', run.reviewStatus ?? run.status],
          ['Changes', changeSummary(run.changes)],
        ],
      ),
    )
  }

  return { type: 'doc', content }
}
