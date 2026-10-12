export type AcknowledgementFormat = 'deakin' | 'usyd'

export type AcknowledgementRun = {
  prompt: string
  createdAt: Date | string
  model: string
}

export const TOOL_ATTRIBUTION = {
  name: 'PenPal AI',
  version: '0.1',
  publisher: 'PenPal',
  url: 'https://penpal.ai',
}

export function monthYearAccessed(date = new Date()): string {
  return date.toLocaleString('en-AU', { month: 'long', year: 'numeric' })
}

export function buildAcknowledgement(input: {
  format: AcknowledgementFormat
  runs: AcknowledgementRun[]
  usageSummary: string
  accessedAt?: Date
}): string {
  const accessed = monthYearAccessed(input.accessedAt)
  const prompts = input.runs.map((run) => run.prompt.trim()).filter(Boolean)
  const promptList =
    prompts.length > 0 ? prompts.map((prompt) => `- ${prompt}`).join('\n') : '- (no prompts recorded)'
  const model = input.runs[0]?.model || 'unspecified'

  if (input.format === 'usyd') {
    return `I acknowledge the use of ${TOOL_ATTRIBUTION.name} (version ${TOOL_ATTRIBUTION.version}), published by ${TOOL_ATTRIBUTION.publisher}, ${TOOL_ATTRIBUTION.url}, accessed ${accessed}.

The tool was used as follows:
${input.usageSummary.trim() || 'The tool was used to assist with drafting and editing this document.'}

Prompts:
${promptList}

Model: ${model}`
  }

  return `I acknowledge the use of ${TOOL_ATTRIBUTION.name} (publisher: ${TOOL_ATTRIBUTION.publisher}; ${TOOL_ATTRIBUTION.url}), accessed ${accessed}.

Prompts used:
${promptList}

Output and where it was used:
${input.usageSummary.trim() || 'The generated output was used to assist with drafting and editing this document.'}`
}
