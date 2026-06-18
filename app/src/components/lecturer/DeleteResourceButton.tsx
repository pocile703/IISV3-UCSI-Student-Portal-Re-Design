'use client'
import { useState, useTransition } from 'react'

interface Props {
  resourceTitle: string
  onDelete: () => Promise<{ error?: string; success?: boolean }>
}

export function DeleteResourceButton({ resourceTitle, onDelete }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await onDelete()
      if (result.error) {
        setError(result.error)
      } else {
        setConfirming(false)
      }
    })
  }

  if (confirming) {
    return (
      <div className="mt-2 flex flex-col gap-1">
        <div
          className="flex items-center justify-between gap-3 rounded-lg border border-[--ucsi-border] p-3"
          style={{ backgroundColor: 'var(--bg-elevated)' }}
        >
          <p className="text-sm text-[--text-primary]">
            Delete <span className="font-medium">&quot;{resourceTitle}&quot;</span>? This cannot be undone.
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => { setConfirming(false); setError(null) }}
              disabled={isPending}
              className="cursor-pointer text-xs text-[--text-secondary] hover:text-[--text-primary] transition-colors focus-visible:outline-none disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="cursor-pointer rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
        {error && (
          <p className="text-xs text-red-600" role="alert">{error}</p>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="cursor-pointer text-xs text-[--text-muted] hover:text-red-600 transition-colors focus-visible:outline-none"
      aria-label={`Delete ${resourceTitle}`}
    >
      Delete
    </button>
  )
}
