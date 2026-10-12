import { describe, expect, it } from 'vitest'
import { buildAcknowledgement, TOOL_ATTRIBUTION } from './acknowledgement.js'

describe('buildAcknowledgement', () => {
  it('includes Deakin fields', () => {
    const statement = buildAcknowledgement({
      format: 'deakin',
      runs: [{ prompt: 'Fix headings', createdAt: new Date('2026-10-01'), model: 'test-model' }],
      usageSummary: 'Used to restyle headings.',
      accessedAt: new Date('2026-10-12'),
    })
    expect(statement).toContain(TOOL_ATTRIBUTION.name)
    expect(statement).toContain('Fix headings')
    expect(statement).toContain('Used to restyle headings.')
    expect(statement).toContain('October 2026')
  })

  it('includes USyd tool name, version, publisher and URL', () => {
    const statement = buildAcknowledgement({
      format: 'usyd',
      runs: [{ prompt: 'Check citations', createdAt: new Date(), model: 'test-model' }],
      usageSummary: 'Used to verify references.',
      accessedAt: new Date('2026-10-12'),
    })
    expect(statement).toContain(TOOL_ATTRIBUTION.version)
    expect(statement).toContain(TOOL_ATTRIBUTION.publisher)
    expect(statement).toContain(TOOL_ATTRIBUTION.url)
    expect(statement).toContain('Check citations')
  })
})
