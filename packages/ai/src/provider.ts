import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import type { LanguageModel } from 'ai'

export function createOpenRouterModels(input: {
  apiKey: string
  model: string
  fastModel?: string
}): { model: LanguageModel; fastModel: LanguageModel } {
  const openrouter = createOpenRouter({ apiKey: input.apiKey })
  const model = openrouter(input.model)
  const fastModel = openrouter(input.fastModel ?? input.model)
  return { model, fastModel }
}
