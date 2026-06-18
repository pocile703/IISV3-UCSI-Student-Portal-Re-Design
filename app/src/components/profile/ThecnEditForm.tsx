'use client'

import { useActionState } from 'react'
import { ExternalLink, Link } from 'lucide-react'

type State = { error?: string; success?: boolean }

interface ThecnEditFormProps {
  current?: string
  action: (prev: State, formData: FormData) => Promise<State>
}

export function ThecnEditForm({ current, action }: ThecnEditFormProps) {
  const [state, dispatch, pending] = useActionState(action, {})

  return (
    <div
      className="rounded-xl border border-[--ucsi-border] p-4 flex flex-col gap-3"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      <div className="flex items-center gap-2">
        <Link size={15} className="text-[--text-secondary]" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-[--text-primary]">E-Portfolio</h2>
        {current && (
          <a
            href={`https://thecn.com/${current}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-xs font-medium hover:underline"
            style={{ color: 'var(--ucsi-red)' }}
          >
            thecn.com/{current}
            <ExternalLink size={11} aria-hidden="true" />
          </a>
        )}
      </div>

      <form action={dispatch} className="flex items-center gap-2">
        <label htmlFor="thecnUsername" className="sr-only">thecn username</label>
        <span className="shrink-0 text-sm text-[--text-secondary]">thecn.com/</span>
        <input
          id="thecnUsername"
          name="thecnUsername"
          type="text"
          defaultValue={current ?? ''}
          placeholder="your-username"
          maxLength={100}
          className="min-w-0 flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-sm text-[--text-primary] placeholder:text-[--text-muted] focus:outline-none focus:ring-2 focus:ring-[#C1272D] focus:border-transparent"
          style={{ backgroundColor: 'var(--bg-elevated)' }}
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={{ backgroundColor: '#C1272D' }}
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
      </form>

      {state.success && (
        <p className="text-xs text-green-600 dark:text-green-400">E-Portfolio link updated.</p>
      )}
      {state.error && (
        <p className="text-xs text-[#C1272D]">{state.error}</p>
      )}

      <p className="text-[11px] text-[--text-muted]">
        Leave blank to remove. Your thecn profile will be linked publicly on your profile page.
      </p>
    </div>
  )
}
