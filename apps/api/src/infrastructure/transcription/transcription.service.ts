import { Injectable } from '@nestjs/common'

export type TranscriptionProvider = {
  transcribe: (audio: Buffer, mimeType: string) => Promise<string>
}

@Injectable()
export class TranscriptionService implements TranscriptionProvider {
  async transcribe(audio: Buffer, mimeType: string): Promise<string> {
    const provider = process.env.TRANSCRIPTION_PROVIDER ?? 'openai'
    const key =
      provider === 'groq' ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY
    if (!key) {
      throw new Error('Transcription is not configured. Set OPENAI_API_KEY or GROQ_API_KEY.')
    }

    const endpoint =
      provider === 'groq'
        ? 'https://api.groq.com/openai/v1/audio/transcriptions'
        : 'https://api.openai.com/v1/audio/transcriptions'
    const model = provider === 'groq' ? 'whisper-large-v3-turbo' : 'whisper-1'

    const form = new FormData()
    form.append(
      'file',
      new Blob([new Uint8Array(audio)], { type: mimeType }),
      'audio.webm',
    )
    form.append('model', model)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    })
    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.status} ${await response.text()}`)
    }
    const json = (await response.json()) as { text: string }
    return json.text
  }
}
