import { Injectable } from '@nestjs/common'
import { createOpenRouterModels } from '@docai/ai'
import type { LanguageModel } from 'ai'

@Injectable()
export class ModelProvider {
  getModels(): { model: LanguageModel; fastModel: LanguageModel } {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is required for AI runs')
    }
    return createOpenRouterModels({
      apiKey,
      model: process.env.OPENROUTER_MODEL ?? 'anthropic/claude-sonnet-4',
      fastModel: process.env.OPENROUTER_FAST_MODEL ?? 'openai/gpt-4.1-mini',
    })
  }
}
