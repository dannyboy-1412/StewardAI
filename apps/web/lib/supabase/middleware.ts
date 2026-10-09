import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { safeNextPath } from '@/lib/auth-redirect'
import { supabasePublicConfig } from '@/lib/env'

function copySession(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie)
  }
  for (const header of ['cache-control', 'expires', 'pragma']) {
    const value = from.headers.get(header)
    if (value) to.headers.set(header, value)
  }
  return to
}

export async function updateSession(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const isAuthPage = pathname === '/login' || pathname === '/signup'
  const isProtected = pathname.startsWith('/app') || pathname.startsWith('/d/')

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    if (isProtected) {
      const redirect = request.nextUrl.clone()
      redirect.pathname = '/login'
      redirect.search = `?next=${encodeURIComponent(`${pathname}${search}`)}`
      return NextResponse.redirect(redirect)
    }
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })
  const { url, publishableKey } = supabasePublicConfig()

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        )
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value)
        })
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const signedIn = Boolean(data?.claims)

  if (!signedIn && isProtected) {
    const redirect = request.nextUrl.clone()
    redirect.pathname = '/login'
    redirect.search = `?next=${encodeURIComponent(`${pathname}${search}`)}`
    return copySession(supabaseResponse, NextResponse.redirect(redirect))
  }

  if (signedIn && isAuthPage) {
    const redirect = new URL(safeNextPath(request.nextUrl.searchParams.get('next')), request.url)
    return copySession(supabaseResponse, NextResponse.redirect(redirect))
  }

  return supabaseResponse
}
