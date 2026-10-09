'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Logo } from '@/components/Logo'
import { createClient } from '@/lib/supabase/client'

type AuthFormProps = {
  mode: 'login' | 'signup'
  nextPath: string
  error?: string
}

export function AuthForm({ mode, nextPath, error }: AuthFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(error ?? '')
  const [busy, setBusy] = useState(false)
  const isSignup = mode === 'signup'

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const supabase = createClient()
    try {
      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim() || undefined },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          },
        })
        if (signUpError) throw signUpError
        if (!data.session) {
          setMessage('Check your email to confirm your account.')
          return
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
      }
      router.push(nextPath)
      router.refresh()
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'Could not sign in')
    } finally {
      setBusy(false)
    }
  }

  async function signInWithGoogle() {
    setBusy(true)
    setMessage('')
    const supabase = createClient()
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    })
    if (oauthError) {
      setMessage(oauthError.message)
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e8efe6] px-4 py-12">
      <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-white p-8 shadow-[0_30px_80px_rgba(20,50,40,0.12)]">
        <Link href="/" className="inline-flex">
          <Logo />
        </Link>
        <h1 className="serif mt-6 text-3xl tracking-tight text-forest">
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {isSignup
            ? 'Start drafting with PenPal in a few seconds.'
            : 'Sign in to open your documents.'}
        </p>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={busy}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-sm font-medium text-forest transition hover:bg-mist disabled:opacity-60"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
          <span className="h-px flex-1 bg-line" />
          or
          <span className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {isSignup ? (
            <label className="block text-sm text-forest-2">
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                className="mt-1 w-full rounded-xl border border-line bg-mist px-3 py-2 text-sm text-ink outline-none focus:border-leaf"
              />
            </label>
          ) : null}
          <label className="block text-sm text-forest-2">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="mt-1 w-full rounded-xl border border-line bg-mist px-3 py-2 text-sm text-ink outline-none focus:border-leaf"
            />
          </label>
          <label className="block text-sm text-forest-2">
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              className="mt-1 w-full rounded-xl border border-line bg-mist px-3 py-2 text-sm text-ink outline-none focus:border-leaf"
            />
          </label>
          {message ? <p className="text-sm text-leaf">{message}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-forest px-4 py-2.5 text-sm font-medium text-white transition hover:bg-forest-2 disabled:opacity-60"
          >
            {isSignup ? 'Sign up' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {isSignup ? (
            <>
              Already have an account?{' '}
              <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="text-forest hover:underline">
                Sign in
              </Link>
            </>
          ) : (
            <>
              New here?{' '}
              <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="text-forest hover:underline">
                Create an account
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.82-.07-1.64-.23-2.43H12v4.6h6.46a5.52 5.52 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.55-5.17 3.55-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.93l-3.88-3c-1.08.72-2.47 1.14-4.07 1.14-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.25A7.2 7.2 0 0 1 4.89 12c0-.78.14-1.54.38-2.25V6.66H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.34l4-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.43-3.43C17.95 1.14 15.23 0 12 0 7.31 0 3.2 2.69 1.27 6.66l4 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  )
}
