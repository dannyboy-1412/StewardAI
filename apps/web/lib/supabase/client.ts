import { createBrowserClient } from '@supabase/ssr'
import { supabasePublicConfig } from '@/lib/env'

export function createClient() {
  const { url, publishableKey } = supabasePublicConfig()
  return createBrowserClient(url, publishableKey)
}
