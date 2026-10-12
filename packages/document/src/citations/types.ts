export const CITATION_STYLES = ['apa7', 'harvard', 'aglc4', 'ieee', 'vancouver'] as const

export type CitationStyle = (typeof CITATION_STYLES)[number]

export type CslName = {
  family?: string
  given?: string
  literal?: string
}

export type CslDate = {
  'date-parts'?: number[][]
}

export type CslJson = {
  type?: string
  id?: string
  title?: string
  author?: CslName[]
  editor?: CslName[]
  issued?: CslDate
  publisher?: string
  'container-title'?: string
  volume?: string
  issue?: string
  page?: string
  DOI?: string
  URL?: string
  ISBN?: string
}

export type DetectedReference = {
  blockId: string
  text: string
  surname?: string
  year?: string
  title?: string
  doi?: string
  url?: string
}

export type InTextCitation = {
  text: string
  surname?: string
  year?: string
  numeric?: number
  blockId: string
}

export type CitationReport = {
  headingBlockId: string | null
  entries: DetectedReference[]
  inText: InTextCitation[]
  orphanCitations: InTextCitation[]
  orphanReferences: DetectedReference[]
}

export type VerificationStatus = 'verified' | 'mismatch' | 'unverified'

export type VerificationResult = {
  status: VerificationStatus
  csl?: CslJson
  doi?: string
  url?: string
  differences?: string[]
  source?: 'crossref' | 'openalex'
}
