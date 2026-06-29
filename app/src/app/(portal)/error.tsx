'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

// Error boundary for the portal route group. Catches render/data errors in any
// portal page and offers a retry without a full reload.
export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surface the error to the console for debugging (digest links to the server log).
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: 'var(--bg-elevated)' }}
      >
        <AlertTriangle size={22} style={{ color: 'var(--ucsi-red)' }} aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-[--text-primary]">Something went wrong</h2>
        <p className="max-w-sm text-sm text-[--text-secondary]">
          We couldn&apos;t load this page. This is usually temporary — please try again.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C1272D]"
        style={{ backgroundColor: 'var(--ucsi-red)' }}
      >
        <RotateCcw size={14} aria-hidden="true" />
        Try again
      </button>
    </div>
  )
}
