export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
export const COLLAB_URL = process.env.NEXT_PUBLIC_COLLAB_URL ?? 'ws://localhost:4000/collab'

export function supabasePublicConfig() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!rawUrl || !publishableKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set',
    )
  }
  const url = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
  return { url, publishableKey }
}
