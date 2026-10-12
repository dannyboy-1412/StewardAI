import { describe, expect, it, beforeEach } from 'vitest'
import { clearVerifierCache, verifyReference } from './reference-verifier.js'

describe('verifyReference', () => {
  beforeEach(() => {
    clearVerifierCache()
  })

  it('verifies a Crossref DOI match', async () => {
    const result = await verifyReference(
      {
        title: 'Solar farms and grid stability',
        authors: 'Smith, Jane',
        year: '2020',
        doi: '10.1234/solar',
      },
      {
        crossrefDoi: async () => ({
          DOI: '10.1234/solar',
          title: ['Solar farms and grid stability'],
          author: [{ family: 'Smith', given: 'Jane' }],
          issued: { 'date-parts': [[2020]] },
          publisher: 'Energy Press',
        }),
        crossrefQuery: async () => null,
        openAlex: async () => null,
      },
    )
    expect(result.status).toBe('verified')
    expect(result.csl?.DOI).toBe('10.1234/solar')
    expect(result.source).toBe('crossref')
  })

  it('falls back to OpenAlex when Crossref misses', async () => {
    const result = await verifyReference(
      {
        title: 'Made-up paper about zebras',
        authors: 'Lee, A',
        year: '2019',
      },
      {
        crossrefDoi: async () => null,
        crossrefQuery: async () => null,
        openAlex: async () => ({
          display_name: 'Made-up paper about zebras',
          publication_year: 2019,
          doi: 'https://doi.org/10.5555/zebra',
          authorships: [{ author: { display_name: 'A Lee' } }],
        }),
      },
    )
    expect(result.status).toBe('verified')
    expect(result.source).toBe('openalex')
  })

  it('returns unverified when no catalogue match exists', async () => {
    const result = await verifyReference(
      { title: 'Completely invented source', authors: 'Nobody', year: '1999' },
      {
        crossrefDoi: async () => null,
        crossrefQuery: async () => null,
        openAlex: async () => null,
      },
    )
    expect(result.status).toBe('unverified')
  })
})
