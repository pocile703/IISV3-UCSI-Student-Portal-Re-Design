'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { UserPageRow } from '@/types/admin-users'
import { getStudentProfileForEdit, type StudentEditFields } from '@/app/(portal)/admin/users/actions'

type Props = {
  user: UserPageRow
  onClose: () => void
}

const ROLE_LABEL: Record<UserPageRow['role'], string> = {
  STUDENT: 'Student',
  LECTURER: 'Lecturer',
  ADMIN: 'Administrator',
}

// Read-only detail row. Value falls back to an em dash when absent.
function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-[--text-secondary]">{label}</span>
      <span className="text-sm text-[--text-primary]">
        {value && value.trim() !== '' ? value : <span className="text-[--text-muted]">—</span>}
      </span>
    </div>
  )
}

export function ViewUserModal({ user, onClose }: Props) {
  const isStudent = user.role === 'STUDENT'
  const [profile, setProfile] = useState<StudentEditFields | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Students carry extra PII (contact/guardian/address) that is not on the summary
  // row — fetch it on demand, reusing the same action the edit modal uses.
  useEffect(() => {
    if (!isStudent) return
    let cancelled = false
    getStudentProfileForEdit(user.id).then((res) => {
      if (cancelled) return
      if ('error' in res) setLoadError(res.error)
      else setProfile(res.profile)
    })
    return () => {
      cancelled = true
    }
  }, [user.id, isStudent])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.currentTarget === e.target) onClose()
  }

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-user-title"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-xl shadow-xl"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[--ucsi-border] px-6 py-4">
          <div>
            <h2 id="view-user-title" className="text-sm font-semibold text-[--text-primary]">
              {user.fullName ?? user.emailInstitutional}
            </h2>
            <p className="mt-0.5 flex items-center gap-2 text-xs text-[--text-secondary]">
              {ROLE_LABEL[user.role]}
              <Badge
                variant={user.isActive ? 'success' : 'danger'}
                aria-label={`Status: ${user.isActive ? 'Active' : 'Inactive'}`}
              >
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-4 rounded-md p-1 text-[--text-muted] hover:bg-zinc-100 dark:hover:bg-white/10"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
          {/* Account */}
          <section className="grid gap-3 sm:grid-cols-2">
            <Row label="Institutional Email" value={user.emailInstitutional} />
            {isStudent ? (
              <>
                <Row label="Student Number" value={user.studentNumber} />
                <Row label="Programme" value={user.programmeCode} />
              </>
            ) : (
              <>
                <Row label="Staff Number" value={user.staffNumber} />
                <Row label="Department" value={user.department} />
                <Row
                  label="Teaching Sections"
                  value={user.sectionCodes.length > 0 ? user.sectionCodes.join(', ') : null}
                />
              </>
            )}
          </section>

          {/* Student-only extended profile */}
          {isStudent && (
            <section className="flex flex-col gap-3 border-t border-[--ucsi-border] pt-4">
              <h3 className="text-xs font-semibold text-[--text-primary]">Contact &amp; Guardian</h3>
              {loadError ? (
                <p className="text-sm text-red-500" role="alert">
                  {loadError}
                </p>
              ) : !profile ? (
                <p className="text-sm text-[--text-muted]">Loading profile…</p>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Row label="Mobile" value={profile.mobile} />
                    <Row label="Marital Status" value={profile.maritalStatus} />
                    <Row label="Guardian Name" value={profile.guardianName} />
                    <Row label="Guardian Relation" value={profile.guardianRelation} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Row label="Address Line 1" value={profile.addressLine1} />
                    <Row label="Address Line 2" value={profile.addressLine2} />
                    <Row label="City" value={profile.city} />
                    <Row label="State" value={profile.state} />
                    <Row label="Postcode" value={profile.postcode} />
                    <Row label="Country" value={profile.country} />
                  </div>
                </>
              )}
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[--ucsi-border] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[--ucsi-border] px-4 py-1.5 text-xs font-medium text-[--text-secondary] hover:bg-zinc-100 dark:hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
