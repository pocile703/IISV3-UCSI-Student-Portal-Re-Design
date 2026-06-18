'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Image from 'next/image'

function getSafeCallbackUrl(raw: string | null): string {
  if (!raw) return '/dashboard'
  if (!raw.startsWith('/')) return '/dashboard'
  if (raw.startsWith('//')) return '/dashboard'
  return raw
}

export default function LoginPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const identifierRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setPending(true)

    const form = e.currentTarget
    const identifier = (form.elements.namedItem('identifier') as HTMLInputElement).value.trim()
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const result = await signIn('credentials', {
      identifier,
      password,
      redirect: false,
    })

    setPending(false)

    if (!result?.ok || result.error) {
      setError('Invalid credentials.')
      identifierRef.current?.focus()
      return
    }

    const callbackUrl = getSafeCallbackUrl(searchParams.get('callbackUrl'))
    router.push(callbackUrl)
    router.refresh()
  }

  const INPUT =
    'w-full rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm text-[--text-primary] placeholder:text-[--text-muted] focus:outline-none focus:ring-2 focus:ring-[#C1272D] focus:border-transparent'

  const INPUT_STYLE: React.CSSProperties = { backgroundColor: 'var(--bg-surface)' }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white px-3 py-2 shadow-sm">
          <Image
            src="/college-logo.png"
            alt="UCSI College"
            width={120}
            height={36}
            className="h-9 w-auto object-contain"
            priority
          />
        </div>
        <h1 className="text-xl font-bold text-[--text-primary]">UCSI Student Portal</h1>
        <p className="text-sm text-[--text-secondary]">Sign in to continue</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 shadow-sm"
        style={INPUT_STYLE}
        suppressHydrationWarning
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="identifier" className="text-sm font-medium text-[--text-primary]">
            Student Email / Staff Username
          </label>
          <input
            ref={identifierRef}
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            required
            placeholder="e.g. 2002400001@ucsicollege.edu.my"
            className={INPUT}
            style={INPUT_STYLE}
            suppressHydrationWarning
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-[--text-primary]">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Password"
            className={INPUT}
            style={INPUT_STYLE}
            suppressHydrationWarning
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-[#C1272D]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 w-full rounded-lg py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={{ backgroundColor: '#C1272D' }}
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-xs text-[--text-muted]">
        UCSI College — Student Portal
      </p>
    </div>
  )
}
