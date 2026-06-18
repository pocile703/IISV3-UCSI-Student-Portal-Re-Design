'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProgrammePageRow } from '@/types/admin-programmes'
import {
  adminCreateProgramme,
  adminUpdateProgramme,
} from '@/app/(portal)/admin/programmes/actions'

type ActionState = { error?: string; success?: boolean }

type Props = {
  mode: 'create' | 'edit'
  programme?: ProgrammePageRow // required when mode='edit'
  onClose: () => void
}

const INPUT_STYLE: React.CSSProperties = { backgroundColor: 'var(--bg-surface)' }

const INPUT_CLS =
  'w-full rounded-md border border-[--ucsi-border] bg-transparent px-3 py-1.5 text-sm ' +
  'text-[--text-primary] focus:outline-none focus:ring-2 focus:ring-[#C1272D]/50'

export function ProgrammeModal({ mode, programme, onClose }: Props) {
  const router = useRouter()

  // Controlled status select so we can show the deactivation warning
  const [statusValue, setStatusValue] = useState<'true' | 'false'>(
    programme?.isActive ? 'true' : 'false',
  )

  // Bind programmeId for edit mode — .bind() widens the type, so cast explicitly
  const action =
    mode === 'create'
      ? adminCreateProgramme
      : (adminUpdateProgramme.bind(null, programme!.id) as (
          prev: ActionState,
          formData: FormData,
        ) => Promise<ActionState>)

  const [state, dispatch, isPending] = useActionState<ActionState, FormData>(action, {})

  // Close and refresh on success
  useEffect(() => {
    if (state.success) {
      router.refresh()
      onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success])

  // Escape key close (blocked while pending)
  useEffect(() => {
    if (isPending) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isPending, onClose])

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!isPending && e.currentTarget === e.target) onClose()
  }

  const showDeactivationWarning =
    mode === 'edit' && programme?.isActive === true && statusValue === 'false'

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="programme-modal-title"
    >
      <div
        className="w-full max-w-sm rounded-xl shadow-xl"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[--ucsi-border] px-5 py-4">
          <h2
            id="programme-modal-title"
            className="text-sm font-semibold text-[--text-primary]"
          >
            {mode === 'create' ? 'Add Programme' : 'Edit Programme'}
          </h2>
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer text-sm text-[--text-muted] hover:text-[--text-secondary] disabled:pointer-events-none"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form action={dispatch} className="flex flex-col gap-4 p-5">
          {/* Code */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pm-code"
              className="text-xs font-medium text-[--text-secondary]"
            >
              Programme Code
            </label>
            <input
              autoFocus={mode === 'create'}
              id="pm-code"
              name="code"
              type="text"
              defaultValue={programme?.code ?? ''}
              placeholder="e.g. DIT"
              maxLength={30}
              required
              className={INPUT_CLS}
              style={INPUT_STYLE}
              suppressHydrationWarning
            />
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pm-name"
              className="text-xs font-medium text-[--text-secondary]"
            >
              Programme Name
            </label>
            <input
              autoFocus={mode === 'edit'}
              id="pm-name"
              name="name"
              type="text"
              defaultValue={programme?.name ?? ''}
              placeholder="e.g. Diploma in Information Technology"
              maxLength={200}
              required
              className={INPUT_CLS}
              style={INPUT_STYLE}
              suppressHydrationWarning
            />
          </div>

          {/* Total Credits */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pm-credits"
              className="text-xs font-medium text-[--text-secondary]"
            >
              Total Credits
            </label>
            <input
              id="pm-credits"
              name="totalCredits"
              type="number"
              min={1}
              max={999}
              defaultValue={programme?.totalCredits ?? ''}
              placeholder="e.g. 90"
              required
              className={INPUT_CLS}
              style={INPUT_STYLE}
              suppressHydrationWarning
            />
          </div>

          {/* Duration (Years) */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pm-duration"
              className="text-xs font-medium text-[--text-secondary]"
            >
              Duration (Years)
            </label>
            <input
              id="pm-duration"
              name="durationYears"
              type="number"
              min={1}
              max={10}
              defaultValue={programme?.durationYears ?? ''}
              placeholder="e.g. 3"
              required
              className={INPUT_CLS}
              style={INPUT_STYLE}
              suppressHydrationWarning
            />
          </div>

          {/* Status (edit only) */}
          {mode === 'edit' && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="pm-status"
                className="text-xs font-medium text-[--text-secondary]"
              >
                Status
              </label>
              <select
                id="pm-status"
                name="isActive"
                value={statusValue}
                onChange={e => setStatusValue(e.target.value as 'true' | 'false')}
                className={INPUT_CLS}
                style={INPUT_STYLE}
                suppressHydrationWarning
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              {showDeactivationWarning && (
                <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                  Setting to Inactive will hide this programme from active
                  views. Enrolled students are unaffected.
                </p>
              )}
            </div>
          )}

          {/* Inline error */}
          {state.error && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">
              {state.error}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="cursor-pointer rounded-md border border-[--ucsi-border] px-4 py-1.5 text-sm font-medium text-[--text-secondary] hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
              style={{ backgroundColor: 'var(--ucsi-red)' }}
            >
              {isPending
                ? mode === 'create'
                  ? 'Adding…'
                  : 'Saving…'
                : mode === 'create'
                  ? 'Add Programme'
                  : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
