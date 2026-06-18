'use client'

import { useEffect, useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Info } from 'lucide-react'
import type { UserPageRow } from '@/types/admin-users'
import { adminCreateUser } from '@/app/(portal)/admin/users/actions'

type Role = 'STUDENT' | 'LECTURER' | 'ADMIN'

type Props = {
  onSuccess: (newUser: UserPageRow) => void
  onClose: () => void
}

// Shared inline style — bg-[--bg-surface] is unreliable in Tailwind v4 arbitrary-value syntax.
const INPUT_STYLE: React.CSSProperties = { backgroundColor: 'var(--bg-surface)' }
const INPUT_CLASS =
  'w-full rounded-md border border-[--ucsi-border] px-3 py-1.5 text-sm text-[--text-primary] placeholder:text-[--text-muted] focus:outline-none focus:ring-1 focus:ring-[--ucsi-red] disabled:opacity-50'

export function CreateUserModal({ onSuccess, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<Role>('LECTURER')

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
      const result = await adminCreateUser({
        role,
        username: get('username'),
        emailInstitutional: get('emailInstitutional'),
        password: get('password'),
        ...(role === 'LECTURER' && {
          fullName: get('fullName'),
          staffNumber: get('staffNumber'),
          department: get('department'),
        }),
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
      aria-labelledby="create-user-title"
    >
      <div
        className="w-full max-w-md rounded-xl shadow-xl"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[--ucsi-border] px-6 py-4">
          <div>
            <h2
              id="create-user-title"
              className="text-sm font-semibold text-[--text-primary]"
            >
              Create User Account
            </h2>
            <p className="mt-0.5 text-xs text-[--text-secondary]">
              Profile details can be assigned after account creation.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">

          {/* Role */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="cu-role"
              className="text-xs font-medium text-[--text-secondary]"
            >
              Role
            </label>
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <select
              id="cu-role"
              autoFocus
              value={role}
              onChange={(e) => { setRole(e.target.value as Role); setError(null) }}
              disabled={isPending}
              className={INPUT_CLASS}
              style={INPUT_STYLE}
            >
              <option value="LECTURER">Lecturer</option>
              <option value="ADMIN">Admin</option>
              <option value="STUDENT">Student</option>
            </select>
          </div>

          {/* Account credentials */}
          <div className="flex flex-col gap-3">
            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="cu-username"
                className="text-xs font-medium text-[--text-secondary]"
              >
                Username
                {role !== 'STUDENT' && (
                  <span className="ml-1 font-normal text-[--text-muted]">
                    (used for login)
                  </span>
                )}
              </label>
              <input
                id="cu-username"
                name="username"
                type="text"
                required
                maxLength={50}
                placeholder={
                  role === 'STUDENT'
                    ? 'e.g. stu015'
                    : role === 'ADMIN'
                    ? 'e.g. admin.sarah'
                    : 'e.g. sarah.tan'
                }
                disabled={isPending}
                className={INPUT_CLASS}
                style={INPUT_STYLE}
              />
            </div>

            {/* Institutional email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="cu-email"
                className="text-xs font-medium text-[--text-secondary]"
              >
                Institutional Email
                {role === 'STUDENT' && (
                  <span className="ml-1 font-normal text-[--text-muted]">
                    (used for login)
                  </span>
                )}
              </label>
              <input
                id="cu-email"
                name="emailInstitutional"
                type="email"
                required
                maxLength={100}
                placeholder={
                  role === 'STUDENT'
                    ? '2002400XXX@ucsicollege.edu.my'
                    : 'name@ucsicollege.edu.my'
                }
                disabled={isPending}
                className={INPUT_CLASS}
                style={INPUT_STYLE}
              />
            </div>

            {/* Temporary password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="cu-password"
                className="text-xs font-medium text-[--text-secondary]"
              >
                Temporary Password
              </label>
              <input
                id="cu-password"
                name="password"
                type="password"
                required
                minLength={8}
                maxLength={128}
                placeholder="Min. 8 characters"
                disabled={isPending}
                className={INPUT_CLASS}
                style={INPUT_STYLE}
              />
              <p className="text-[11px] text-[--text-muted]">
                Share this with the user — they can change it after first login.
              </p>
            </div>
          </div>

          {/* Lecturer profile fields */}
          {role === 'LECTURER' && (
            <div className="flex flex-col gap-3 rounded-lg border border-[--ucsi-border] px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[--text-muted]">
                Lecturer Profile
              </p>

              {/* Full name */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="cu-fullname"
                  className="text-xs font-medium text-[--text-secondary]"
                >
                  Full Name
                </label>
                <input
                  id="cu-fullname"
                  name="fullName"
                  type="text"
                  required
                  maxLength={150}
                  placeholder="e.g. Dr. Sarah Tan"
                  disabled={isPending}
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                />
              </div>

              {/* Staff number + department — 2-col */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="cu-staffno"
                    className="text-xs font-medium text-[--text-secondary]"
                  >
                    Staff Number
                  </label>
                  <input
                    id="cu-staffno"
                    name="staffNumber"
                    type="text"
                    required
                    maxLength={30}
                    placeholder="e.g. LEC006"
                    disabled={isPending}
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="cu-dept"
                    className="text-xs font-medium text-[--text-secondary]"
                  >
                    Department
                  </label>
                  <input
                    id="cu-dept"
                    name="department"
                    type="text"
                    required
                    maxLength={100}
                    placeholder="e.g. School of IT"
                    disabled={isPending}
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Profile-deferred notice for STUDENT / ADMIN */}
          {role !== 'LECTURER' && (
            <div className="flex items-start gap-2 rounded-md bg-zinc-50 px-3 py-2.5 dark:bg-white/5">
              <Info
                size={13}
                className="mt-0.5 shrink-0 text-[--text-muted]"
                aria-hidden="true"
              />
              <p className="text-[11px] text-[--text-secondary]">
                {role === 'STUDENT'
                  ? 'Student profile details (full name, student number, date of birth, etc.) must be completed separately after account creation.'
                  : 'Admin accounts don’t require a separate profile—only account credentials are needed.'}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500" role="alert">
              {error}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-1">
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
              {isPending ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
