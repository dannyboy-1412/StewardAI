import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import type { CurrentUserRecord } from './current-user.js'

function supabaseProjectUrl(): string {
  const raw = process.env.SUPABASE_URL
  if (!raw) throw new Error('SUPABASE_URL is required')
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

function issuer(): string {
  return `${supabaseProjectUrl()}/auth/v1`
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${issuer()}/.well-known/jwks.json`))
  }
  return jwks
}

function metadataRecord(payload: JWTPayload): Record<string, unknown> {
  const metadata = payload.user_metadata
  return metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>) : {}
}

function displayName(payload: JWTPayload, email: string): string {
  const record = metadataRecord(payload)
  if (typeof record.full_name === 'string' && record.full_name.trim()) {
    return record.full_name
  }
  if (typeof record.name === 'string' && record.name.trim()) {
    return record.name
  }
  return email.split('@')[0] || 'User'
}

function tokenEmail(payload: JWTPayload): string {
  return typeof payload.email === 'string' ? payload.email : ''
}

export function getBearerToken(header?: string): string | null {
  if (!header) return null
  const [scheme, token, ...rest] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token || rest.length > 0) return null
  return token
}

export async function verifySupabaseAccessToken(token: string): Promise<CurrentUserRecord> {
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: issuer(),
    audience: 'authenticated',
  })
  const id = typeof payload.sub === 'string' ? payload.sub : ''
  const email = tokenEmail(payload)
  if (!id || !email) {
    throw new Error('Token is missing subject or email')
  }
  return {
    id,
    email,
    name: displayName(payload, email),
  }
}
