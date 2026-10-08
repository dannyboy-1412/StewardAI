export async function* readSse(response: Response) {
  if (!response.body) throw new Error('No response body')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''
    for (const part of parts) {
      const line = part.split('\n').find((item) => item.startsWith('data:'))
      if (!line) continue
      const payload = line.replace(/^data:\s?/, '')
      if (payload === '[DONE]') return
      try {
        yield JSON.parse(payload) as Record<string, unknown>
      } catch {
        continue
      }
    }
  }
}
