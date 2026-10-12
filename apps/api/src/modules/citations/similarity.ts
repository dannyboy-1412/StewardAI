export function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function titleSimilarity(left: string, right: string): number {
  const a = new Set(normalizeTitle(left).split(' ').filter((token) => token.length > 2))
  const b = new Set(normalizeTitle(right).split(' ').filter((token) => token.length > 2))
  if (a.size === 0 || b.size === 0) return 0
  let overlap = 0
  for (const token of a) {
    if (b.has(token)) overlap += 1
  }
  return overlap / Math.max(a.size, b.size)
}

export function surnameOf(authors: string | undefined): string | undefined {
  if (!authors) return undefined
  const first = authors.split(/,|&| and /i)[0]?.trim()
  if (!first) return undefined
  const bits = first.split(/\s+/)
  return bits.at(-1)?.replace(/[^A-Za-z'-]/g, '')
}
