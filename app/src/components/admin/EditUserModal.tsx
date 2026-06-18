'use client'

import { useEffect, useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, AlertTriangle } from 'lucide-react'
import type { UserPageRow } from '@/types/admin-users'
import { adminUpdateUser } from '@/app/(portal)/admin/users/actions'

type AllowedRole = 'LECTURER' | 'ADMIN'

type Props = {
  user: UserPageRow
  onSuccess: (updated: UserPageRow) => void
  onClose: () => void
}

export function EditUserModal({ user, onSuccess, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Controlled selects — initialize from current user state
  const [selectedRole, setSelectedRole] = useState<AllowedRole>(() =>
    user.role === 'LECTURER' || user.role === 'ADMIN' ? user.role : 'LECTURER',
  )
  const [selectedActive, setSelectedActive] = useState<boolean>(user.isActive)

  const canChangeRole = user.role !== 'STUDENT'
  const showDeactivationWarning = user.isActive && !selectedActive

  // Escape key closes (but not while pending)
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const roleChanged =
      canChangeRole && (selectedRole as string) !== (user.role as string)
    const activeChanged = selectedActive !== user.isActive

    // Nothing changed — close silently (no-op)
    if (!roleChanged && !activeChanged) {
      onClose()
      return
    }

    const patch: { isActive?: boolean; role?: AllowedRole } = {}
    if (activeChanged) patch.isActive = selectedActive
    if (roleChanged) patch.role = selectedRole

    startTransition(async () => {
      const result = await adminUpdateUser(user.id, patch)
      if (result.error) {
        setError(result.error)
        return
      }
      const updated: UserPageRow = {
        ...user,
        isActive: patch.isActive ?? user.isActive,
        role: (patch.role ?? user.role) as UserPageRow['role'],
      }
      onSuccess(updated)
      router.refresh()
      onClose()
    })
  }

  const displayName = user.fullName ?? user.emailInstitutional

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-user-title"
    >
      <div
        className="w-full max-w-sm rounded-xl shadow-xl"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[--ucsi-border] px-6 py-4">
          <div>
            <h2
              id="edit-user-title"
              className="text-sm font-semibold text-[--text-primary]"
            >
              Edit User
            </h2>
            <p className="mt-0.5 text-xs font-medium text-[--text-primary]">
              {displayName}
            </p>
            <p className="text-xs text-[--text-secondary]">
              {user.emailInstitutional}
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-4">
          {/* Account Status */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="edit-user-status"
              className="text-xs font-medium text-[--text-secondary]"
            >
              Account Status
            </label>
            <select
              id="edit-user-status"
              autoFocus
              value={selectedActive ? 'active' : 'inactive'}
              onChange={(e) => setSelectedActive(e.target.value === 'active')}
              disabled={isPending}
              className="rounded-md border border-[--ucsi-border] bg-transparent px-3 py-1.5 text-sm text-[--text-primary] disabled:opacity-50"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Role */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="edit-user-role"
              className={`text-xs font-medium ${
                canChangeRole ? 'text-[--text-secondary]' : 'text-[--text-muted]'
              }`}
            >
              Role
            </label>
            {canChangeRole ? (
              <select
                id="edit-user-role"
                value={selectedRole}
                onChange={(e) =>
                  setSelectedRole(e.target.value as AllowedRole)
                }
                disabled={isPending}
                className="rounded-md border border-[--ucsi-border] bg-transparent px-3 py-1.5 text-sm text-[--text-primary] disabled:opacity-50"
              >
                <option value="LECTURER">Lecturer</option>
                <option value="ADMIN">Admin</option>
              </select>
            ) : (
              <p className="text-xs text-[--text-muted]">
                Role cannot be changed for student accounts.
              </p>
            )}
          </div>

          {/* Deactivation warning */}
          {showDeactivationWarning && (
            <div className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2.5 dark:bg-amber-900/20">
              <AlertTriangle
                size={14}
                className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
                aria-hidden="true"
              />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Deactivating this account will sign{' '}
                {user.fullName ?? 'this user'} out immediately.
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
              {isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
