import type { CslJson, VerificationResult } from '@docai/document'
import { surnameOf, titleSimilarity } from './similarity.js'

type LookupInput = {
  title: string
  authors?: string
  year?: string
  url?: string
  doi?: string
  text?: string
}

type CrossrefWork = {
  DOI?: string
  title?: string[]
  author?: Array<{ family?: string; given?: string }>
  issued?: { 'date-parts'?: number[][] }
  publisher?: string
  URL?: string
  'container-title'?: string[]
  volume?: string
  issue?: string
  page?: string
}

type OpenAlexWork = {
  doi?: string | null
  display_name?: string
  publication_year?: number
  ids?: { doi?: string }
  authorships?: Array<{ author?: { display_name?: string } }>
  primary_location?: { source?: { display_name?: string } | null; landing_page_url?: string | null }
}

const cache = new Map<string, { expires: number; value: VerificationResult }>()
const CACHE_TTL_MS = 1000 * 60 * 30

function cacheKey(input: LookupInput): string {
  return JSON.stringify({
    title: input.title,
    authors: input.authors,
    year: input.year,
    doi: input.doi,
    url: input.url,
  })
}

function extractDoi(input: LookupInput): string | undefined {
  const raw = `${input.doi ?? ''} ${input.url ?? ''} ${input.text ?? ''}`
  const match = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i.exec(raw)
  return match?.[0]?.replace(/[.,;]+$/, '')
}

function mailto(): string {
  return process.env.CROSSREF_MAILTO || 'penpal@localhost'
}

async function fetchJson<T>(url: string, headers: Record<string, string> = {}): Promise<T | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8_000)
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': `PenPalAI/0.1 (mailto:${mailto()})`,
        ...headers,
      },
      signal: controller.signal,
    })
    if (!response.ok) return null
    return (await response.json()) as T
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function cslFromCrossref(work: CrossrefWork): CslJson {
  return {
    type: 'article-journal',
    title: work.title?.[0],
    author: (work.author ?? []).map((author) => ({ family: author.family, given: author.given })),
    issued: work.issued,
    publisher: work.publisher,
    'container-title': work['container-title']?.[0],
    volume: work.volume,
    issue: work.issue,
    page: work.page,
    DOI: work.DOI,
    URL: work.DOI ? `https://doi.org/${work.DOI}` : work.URL,
  }
}

function cslFromOpenAlex(work: OpenAlexWork): CslJson {
  const doi = work.doi?.replace(/^https?:\/\/doi\.org\//i, '') ?? work.ids?.doi?.replace(/^https?:\/\/doi\.org\//i, '')
  return {
    type: 'article-journal',
    title: work.display_name,
    author: (work.authorships ?? []).map((item) => {
      const display = item.author?.display_name ?? ''
      const bits = display.split(/\s+/)
      return { given: bits.slice(0, -1).join(' '), family: bits.at(-1) }
    }),
    issued: work.publication_year ? { 'date-parts': [[work.publication_year]] } : undefined,
    'container-title': work.primary_location?.source?.display_name,
    DOI: doi ?? undefined,
    URL: doi ? `https://doi.org/${doi}` : (work.primary_location?.landing_page_url ?? undefined),
  }
}

function score(input: LookupInput, csl: CslJson): { score: number; differences: string[] } {
  const differences: string[] = []
  const title = csl.title ?? ''
  const similarity = titleSimilarity(input.title || input.text || '', title)
  if (similarity < 0.45) differences.push('title')
  const year = csl.issued?.['date-parts']?.[0]?.[0]
  if (input.year && year && String(year) !== input.year.replace(/[a-z]$/, '')) {
    differences.push('year')
  }
  const expectedSurname = surnameOf(input.authors)
  const actualSurname = csl.author?.[0]?.family
  if (
    expectedSurname &&
    actualSurname &&
    expectedSurname.toLowerCase() !== actualSurname.toLowerCase()
  ) {
    differences.push('author')
  }
  const scoreValue =
    similarity +
    (differences.includes('year') ? -0.2 : 0.15) +
    (differences.includes('author') ? -0.2 : 0.15)
  return { score: scoreValue, differences }
}

function toResult(input: LookupInput, csl: CslJson, source: 'crossref' | 'openalex'): VerificationResult {
  const { score: value, differences } = score(input, csl)
  if (value >= 0.6 && differences.length === 0) {
    return { status: 'verified', csl, doi: csl.DOI, url: csl.URL, source }
  }
  if (value >= 0.45) {
    return { status: 'mismatch', csl, doi: csl.DOI, url: csl.URL, differences, source }
  }
  return { status: 'unverified', differences, source }
}

async function lookupCrossrefDoi(doi: string): Promise<CrossrefWork | null> {
  const payload = await fetchJson<{ message?: CrossrefWork }>(
    `https://api.crossref.org/works/${encodeURIComponent(doi)}`,
  )
  return payload?.message ?? null
}

async function lookupCrossrefQuery(input: LookupInput): Promise<CrossrefWork | null> {
  const query = [input.title, input.authors, input.year].filter(Boolean).join(' ')
  if (!query.trim()) return null
  const payload = await fetchJson<{ message?: { items?: CrossrefWork[] } }>(
    `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}&rows=3`,
  )
  return payload?.message?.items?.[0] ?? null
}

async function lookupOpenAlex(input: LookupInput): Promise<OpenAlexWork | null> {
  const query = [input.title, input.authors, input.year].filter(Boolean).join(' ')
  if (!query.trim()) return null
  const payload = await fetchJson<{ results?: OpenAlexWork[] }>(
    `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=3`,
  )
  return payload?.results?.[0] ?? null
}

export async function verifyReference(
  input: LookupInput,
  deps: {
    crossrefDoi?: typeof lookupCrossrefDoi
    crossrefQuery?: typeof lookupCrossrefQuery
    openAlex?: typeof lookupOpenAlex
  } = {},
): Promise<VerificationResult> {
  const key = cacheKey(input)
  const cached = cache.get(key)
  if (cached && cached.expires > Date.now()) return cached.value

  const doi = extractDoi(input)
  const crossrefDoi = deps.crossrefDoi ?? lookupCrossrefDoi
  const crossrefQuery = deps.crossrefQuery ?? lookupCrossrefQuery
  const openAlex = deps.openAlex ?? lookupOpenAlex

  let result: VerificationResult = { status: 'unverified' }

  if (doi) {
    const work = await crossrefDoi(doi)
    if (work) result = toResult(input, cslFromCrossref(work), 'crossref')
  }
  if (result.status !== 'verified') {
    const work = await crossrefQuery(input)
    if (work) {
      const next = toResult(input, cslFromCrossref(work), 'crossref')
      if (next.status === 'verified' || result.status === 'unverified') result = next
    }
  }
  if (result.status !== 'verified') {
    const work = await openAlex(input)
    if (work) {
      const next = toResult(input, cslFromOpenAlex(work), 'openalex')
      if (next.status === 'verified' || result.status === 'unverified') result = next
    }
  }

  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, value: result })
  return result
}

export function clearVerifierCache() {
  cache.clear()
}
