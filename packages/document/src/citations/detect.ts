import { blockId, textOf, topLevelBlocks } from '../tree.js'
import type { JSONContent } from '../types.js'
import type { CitationReport, DetectedReference, InTextCitation } from './types.js'

const REFERENCE_HEADING = /^(references|bibliography|works cited|reference list)$/i
const DOI_RE = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i
const YEAR_RE = /\b(19|20)\d{2}\b/
const AUTHOR_YEAR_PAREN = /\(([^()]*\b(?:19|20)\d{2}[^()]*)\)/g
const NARRATIVE_CITE = /\b([A-Z][A-Za-z'-]+)(?:\s+(?:and|&)\s+[A-Z][A-Za-z'-]+|\s+et\s+al\.)?\s*\(((?:19|20)\d{2}[a-z]?)\)/g
const NUMERIC_CITE = /\[(\d+(?:\s*[,–-]\s*\d+)*)\]/g

function firstSurname(text: string): string | undefined {
  const cleaned = text.replace(/^\[\d+]\s*/, '').trim()
  const match = /^([A-Z][A-Za-z'-]+)/.exec(cleaned)
  return match?.[1]
}

function extractYear(text: string): string | undefined {
  return YEAR_RE.exec(text)?.[0]
}

function extractTitle(text: string): string | undefined {
  const quoted = /[“"]([^”"]+)[”"]/.exec(text)
  if (quoted?.[1]) return quoted[1]
  const italicish = /\. ([^.]+)\./.exec(text)
  return italicish?.[1]?.trim()
}

function extractDoi(text: string): string | undefined {
  const match = DOI_RE.exec(text)
  return match?.[0]?.replace(/[.,;]+$/, '')
}

function extractUrl(text: string): string | undefined {
  const match = /https?:\/\/\S+/i.exec(text)
  return match?.[0]?.replace(/[),.;]+$/, '')
}

function findReferencesHeading(doc: JSONContent): { index: number; block: JSONContent } | null {
  const blocks = topLevelBlocks(doc)
  const index = blocks.findIndex(
    (block) => block.type === 'heading' && REFERENCE_HEADING.test(textOf(block).trim()),
  )
  if (index === -1) return null
  return { index, block: blocks[index]! }
}

function parseReference(block: JSONContent): DetectedReference | null {
  const id = blockId(block)
  if (!id) return null
  const text = textOf(block).trim()
  if (!text) return null
  return {
    blockId: id,
    text,
    surname: firstSurname(text),
    year: extractYear(text),
    title: extractTitle(text),
    doi: extractDoi(text),
    url: extractUrl(text),
  }
}

function splitAuthorYearGroup(group: string): Array<{ surname?: string; year?: string; text: string }> {
  return group.split(/;\s*/).flatMap((part) => {
    const year = extractYear(part)
    const surname = firstSurname(part.replace(/^\(/, ''))
    if (!year && !surname) return []
    return [{ surname, year, text: part.trim() }]
  })
}

function detectInText(doc: JSONContent): InTextCitation[] {
  const found: InTextCitation[] = []
  for (const block of topLevelBlocks(doc)) {
    if (block.type === 'heading' && REFERENCE_HEADING.test(textOf(block).trim())) break
    const id = blockId(block)
    if (!id) continue
    const text = textOf(block)
    for (const match of text.matchAll(AUTHOR_YEAR_PAREN)) {
      const group = match[1] ?? ''
      for (const item of splitAuthorYearGroup(group)) {
        found.push({
          text: match[0] ?? item.text,
          surname: item.surname,
          year: item.year,
          blockId: id,
        })
      }
    }
    for (const match of text.matchAll(NARRATIVE_CITE)) {
      found.push({
        text: match[0] ?? '',
        surname: match[1],
        year: match[2],
        blockId: id,
      })
    }
    for (const match of text.matchAll(NUMERIC_CITE)) {
      const numbers = (match[1] ?? '').split(/[,–-]/).map((value) => Number.parseInt(value.trim(), 10))
      for (const numeric of numbers) {
        if (!Number.isFinite(numeric)) continue
        found.push({
          text: `[${numeric}]`,
          numeric,
          blockId: id,
        })
      }
    }
  }
  return found
}

function matchesEntry(citation: InTextCitation, entry: DetectedReference, index: number): boolean {
  if (citation.numeric !== undefined) return citation.numeric === index + 1
  if (!citation.surname || !entry.surname) return false
  const sameName = citation.surname.toLowerCase() === entry.surname.toLowerCase()
  if (!sameName) return false
  if (!citation.year || !entry.year) return sameName
  return citation.year.replace(/[a-z]$/, '') === entry.year.replace(/[a-z]$/, '')
}

export function detectCitations(doc: JSONContent): CitationReport {
  const heading = findReferencesHeading(doc)
  const blocks = topLevelBlocks(doc)
  const entries: DetectedReference[] = []
  if (heading) {
    for (const block of blocks.slice(heading.index + 1)) {
      if (block.type === 'heading') break
      const parsed = parseReference(block)
      if (parsed) entries.push(parsed)
    }
  }

  const inText = detectInText(doc)
  const matchedCitationKeys = new Set<string>()
  const matchedEntryIds = new Set<string>()

  for (const citation of inText) {
    const index = entries.findIndex(
      (entry, entryIndex) =>
        !matchedEntryIds.has(entry.blockId) && matchesEntry(citation, entry, entryIndex),
    )
    if (index === -1) continue
    matchedCitationKeys.add(`${citation.blockId}:${citation.text}:${citation.surname}:${citation.year}:${citation.numeric}`)
    matchedEntryIds.add(entries[index]!.blockId)
  }

  const orphanCitations = inText.filter(
    (citation) =>
      !matchedCitationKeys.has(
        `${citation.blockId}:${citation.text}:${citation.surname}:${citation.year}:${citation.numeric}`,
      ),
  )
  const orphanReferences = entries.filter((entry) => !matchedEntryIds.has(entry.blockId))

  return {
    headingBlockId: heading ? (blockId(heading.block) ?? null) : null,
    entries,
    inText,
    orphanCitations,
    orphanReferences,
  }
}

export function isReferencesHeading(text: string): boolean {
  return REFERENCE_HEADING.test(text.trim())
}
