const PLACEHOLDER_ORIGIN = 'http://internal.invalid'

export function safeNextPath(value: string | null | undefined): string {
  if (!value) return '/app'
  try {
    const resolved = new URL(value, PLACEHOLDER_ORIGIN)
    if (resolved.origin !== PLACEHOLDER_ORIGIN) return '/app'
    const path = `${resolved.pathname}${resolved.search}${resolved.hash}`
    if (!path.startsWith('/') || path.startsWith('//')) return '/app'
    return path
  } catch {
    return '/app'
  }
}
