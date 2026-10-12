import type { CitationStyle, CslJson, CslName } from './types.js'

function namesOf(authors: CslName[] | undefined): CslName[] {
  return authors?.length ? authors : []
}

function familyGiven(name: CslName): { family: string; given: string } {
  if (name.literal) return { family: name.literal, given: '' }
  return { family: name.family ?? '', given: name.given ?? '' }
}

function yearOf(csl: CslJson): string {
  const year = csl.issued?.['date-parts']?.[0]?.[0]
  return year ? String(year) : 'n.d.'
}

function givenInitials(given: string): string {
  return given
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ''}.`)
    .join(' ')
}

function apaAuthors(authors: CslName[] | undefined): string {
  const people = namesOf(authors).map((name) => {
    const { family, given } = familyGiven(name)
    const initials = givenInitials(given)
    return initials ? `${family}, ${initials}` : family
  })
  if (people.length === 0) return ''
  if (people.length === 1) return people[0]!
  if (people.length === 2) return `${people[0]} & ${people[1]}`
  return `${people.slice(0, -1).join(', ')}, & ${people.at(-1)}`
}

function harvardAuthors(authors: CslName[] | undefined): string {
  const people = namesOf(authors).map((name) => {
    const { family, given } = familyGiven(name)
    const initials = givenInitials(given).replaceAll('.', '').replaceAll(' ', '')
    return initials ? `${family}, ${initials.split('').join('.')}.` : family
  })
  if (people.length === 0) return ''
  if (people.length === 1) return people[0]!
  if (people.length === 2) return `${people[0]} and ${people[1]}`
  return `${people.slice(0, -1).join(', ')} and ${people.at(-1)}`
}

function aglcAuthors(authors: CslName[] | undefined): string {
  const people = namesOf(authors).map((name) => {
    const { family, given } = familyGiven(name)
    return given ? `${family}, ${given}` : family
  })
  if (people.length === 0) return ''
  if (people.length === 1) return people[0]!
  if (people.length === 2) return `${people[0]} and ${people[1]}`
  return `${people.slice(0, -1).join(', ')} and ${people.at(-1)}`
}

function ieeeAuthors(authors: CslName[] | undefined): string {
  const people = namesOf(authors).map((name) => {
    const { family, given } = familyGiven(name)
    const initials = givenInitials(given)
    return initials ? `${initials} ${family}` : family
  })
  if (people.length === 0) return ''
  if (people.length === 1) return people[0]!
  return `${people.slice(0, -1).join(', ')}, and ${people.at(-1)}`
}

function vancouverAuthors(authors: CslName[] | undefined): string {
  const people = namesOf(authors).map((name) => {
    const { family, given } = familyGiven(name)
    const initials = given
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')
    return initials ? `${family} ${initials}` : family
  })
  return people.join(', ')
}

function doiUrl(csl: CslJson): string {
  if (csl.DOI) return `https://doi.org/${csl.DOI.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')}`
  return csl.URL ?? ''
}

function sentence(parts: Array<string | undefined | null>): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(' ')
    .replace(/\s+\./g, '.')
    .replace(/\s+,/g, ',')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function formatCsl(csl: CslJson, style: CitationStyle): string {
  const title = csl.title?.trim() ?? 'Untitled'
  const year = yearOf(csl)
  const container = csl['container-title']
  const publisher = csl.publisher
  const link = doiUrl(csl)

  switch (style) {
    case 'apa7': {
      const authors = apaAuthors(csl.author)
      const who = authors || publisher || 'Anonymous'
      const source = container
        ? `${container}${csl.volume ? `, ${csl.volume}` : ''}${csl.issue ? `(${csl.issue})` : ''}${csl.page ? `, ${csl.page}` : ''}.`
        : publisher
          ? `${publisher}.`
          : ''
      return sentence([`${who} (${year}).`, `${title}.`, source, link])
    }
    case 'harvard': {
      const authors = harvardAuthors(csl.author) || publisher || 'Anonymous'
      const source = container ?? publisher ?? ''
      return sentence([`${authors} (${year})`, `${title}.`, source ? `${source}.` : '', link])
    }
    case 'aglc4': {
      const authors = aglcAuthors(csl.author) || publisher || 'Anonymous'
      const publication = container ?? publisher ?? 'n.p.'
      return sentence([`${authors},`, `*${title}*`, `(${publication}, ${year})`])
    }
    case 'ieee': {
      const authors = ieeeAuthors(csl.author) || publisher || 'Anonymous'
      const quoted = `"${title},"`
      const source = container ?? publisher ?? ''
      return sentence([`${authors},`, quoted, source ? `${source},` : '', `${year}.`, link])
    }
    case 'vancouver': {
      const authors = vancouverAuthors(csl.author) || publisher || 'Anonymous'
      const source = container ?? publisher ?? ''
      return sentence([`${authors}.`, `${title}.`, source ? `${source};` : '', `${year}.`, link])
    }
    default: {
      const _exhaustive: never = style
      return _exhaustive
    }
  }
}

export function authorsToCsl(authors?: string): CslName[] {
  if (!authors?.trim()) return []
  return authors.split(/\s*(?:;|&| and )\s*/i).flatMap((part) => {
    const trimmed = part.trim()
    if (!trimmed) return []
    const comma = trimmed.split(',')
    if (comma.length > 1) {
      return [{ family: comma[0]!.trim(), given: comma.slice(1).join(',').trim() }]
    }
    const bits = trimmed.split(/\s+/)
    if (bits.length === 1) return [{ family: bits[0] }]
    return [{ given: bits.slice(0, -1).join(' '), family: bits.at(-1) }]
  })
}

export function sourceToCsl(source: {
  title: string
  authors?: string
  year?: string
  url?: string
  publisher?: string
  doi?: string
}): CslJson {
  const year = source.year ? Number.parseInt(source.year, 10) : undefined
  return {
    type: 'document',
    title: source.title,
    author: authorsToCsl(source.authors),
    issued: Number.isFinite(year) ? { 'date-parts': [[year!]] } : undefined,
    publisher: source.publisher,
    URL: source.url,
    DOI: source.doi,
  }
}
