import { formatCsl, type CitationStyle, type CslJson } from '@docai/document'

export function formatReference(csl: CslJson, style: CitationStyle): string {
  return formatCsl(csl, style)
}
