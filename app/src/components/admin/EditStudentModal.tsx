'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import type { UserPageRow } from '@/types/admin-users'
import {
  getStudentProfileForEdit,
  adminUpdateStudentProfile,
  type StudentEditFields,
} from '@/app/(portal)/admin/users/actions'

type Props = {
  user: UserPageRow
  onSuccess: (updated: UserPageRow) => void
  onClose: () => void
}

const INPUT_STYLE: React.CSSProperties = { backgroundColor: 'var(--bg-surface)' }
const INPUT_CLASS =
  'w-full rounded-md border border-[--ucsi-border] px-3 py-1.5 text-sm text-[--text-primary] placeholder:text-[--text-muted] focus:outline-none focus:ring-1 focus:ring-[--ucsi-red] disabled:opacity-50'
const LABEL_CLASS = 'text-xs font-medium text-[--text-secondary]'

function Field({
  name,
  label,
  defaultValue,
  required = true,
  maxLength,
  disabled,
}: {
  name: string
  label: string
  defaultValue?: string
  required?: boolean
  maxLength?: number
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={`es-${name}`} className={LABEL_CLASS}>{label}</label>
      <input
        id={`es-${name}`}
        name={name}
        type="text"
        required={required}
        maxLength={maxLength}
        defaultValue={defaultValue}
        disabled={disabled}
        className={INPUT_CLASS}
        style={INPUT_STYLE}
      />
    </div>
  )
}

export function EditStudentModal({ user, onSuccess, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<StudentEditFields | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getStudentProfileForEdit(user.id).then((res) => {
      if (cancelled) return
      if ('error' in res) setLoadError(res.error)
      else setProfile(res.profile)
    })
    return () => { cancelled = true }
  }, [user.id])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isPending) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, isPending])

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.currentTarget === e.target && !isPending) onClose()
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const get = (name: string) => (fd.get(name) as string | null) ?? ''

    startTransition(async () => {
      const result = await adminUpdateStudentProfile(user.id, {
        fullName: get('fullName'),
        mobile: get('mobile'),
        maritalStatus: get('maritalStatus') as 'SINGLE' | 'MARRIED' | 'OTHER',
        guardianName: get('guardianName'),
        guardianRelation: get('guardianRelation'),
        addressLine1: get('addressLine1'),
        addressLine2: get('addressLine2'),
        city: get('city'),
        state: get('state'),
        postcode: get('postcode'),
        country: get('country'),
      })
      if (!result.success) {
        setError(result.error ?? 'An unexpected error occurred')
        return
      }
      onSuccess(result.user)
      router.refresh()
      onClose()
    })
  }

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-student-title"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-xl shadow-xl"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[--ucsi-border] px-6 py-4">
          <div>
            <h2 id="edit-student-title" className="text-sm font-semibold text-[--text-primary]">
              Edit Student Profile
            </h2>
            <p className="mt-0.5 text-xs text-[--text-secondary]">
              {user.fullName ?? user.emailInstitutional}
              {profile && <span className="font-mono"> · {profile.studentNumber}</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label="Close"
            className="ml-4 rounded-md p-1 text-[--text-muted] hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-white/10"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {loadError ? (
          <div className="px-6 py-8 text-sm text-red-500" role="alert">{loadError}</div>
        ) : !profile ? (
          <div className="px-6 py-8 text-sm text-[--text-muted]">Loading profile…</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
            <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
              <p className="text-[11px] text-[--text-muted]">
                Identity fields (student number, date of birth, gender) and programme enrollment are not editable here — they are set at creation.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field name="fullName" label="Full Name" maxLength={150} defaultValue={profile.fullName} disabled={isPending} />
                <Field name="mobile" label="Mobile" maxLength={20} defaultValue={profile.mobile} disabled={isPending} />
                <div className="flex flex-col gap-1">
                  <label htmlFor="es-maritalStatus" className={LABEL_CLASS}>Marital Status</label>
                  <select id="es-maritalStatus" name="maritalStatus" required disabled={isPending} className={INPUT_CLASS} style={INPUT_STYLE} defaultValue={profile.maritalStatus}>
                    <option value="SINGLE">Single</option>
                    <option value="MARRIED">Married</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <Field name="guardianName" label="Guardian Name" maxLength={150} defaultValue={profile.guardianName} disabled={isPending} />
                <Field name="guardianRelation" label="Guardian Relation" maxLength={80} defaultValue={profile.guardianRelation} disabled={isPending} />
              </div>
              <Field name="addressLine1" label="Address Line 1" maxLength={200} defaultValue={profile.addressLine1} disabled={isPending} />
              <Field name="addressLine2" label="Address Line 2 (optional)" required={false} maxLength={200} defaultValue={profile.addressLine2} disabled={isPending} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field name="city" label="City" maxLength={100} defaultValue={profile.city} disabled={isPending} />
                <Field name="state" label="State" maxLength={100} defaultValue={profile.state} disabled={isPending} />
                <Field name="postcode" label="Postcode" maxLength={20} defaultValue={profile.postcode} disabled={isPending} />
                <Field name="country" label="Country" maxLength={80} defaultValue={profile.country} disabled={isPending} />
              </div>
              {error && <p className="text-xs text-red-500" role="alert">{error}</p>}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[--ucsi-border] px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="rounded-md border border-[--ucsi-border] px-4 py-1.5 text-xs font-medium text-[--text-secondary] hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="cursor-pointer rounded-md px-4 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: 'var(--ucsi-red)' }}
              >
                {isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
