import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabasePublicConfig } from '@/lib/env'

export async function createClient() {
  const cookieStore = await cookies()
  const { url, publishableKey } = supabasePublicConfig()

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet, headers) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
          void headers
        } catch {
          // Called from a Server Component; middleware refreshes the session.
        }
      },
    },
  })
}
