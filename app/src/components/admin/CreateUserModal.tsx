'use client'

import { useEffect, useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import type { UserPageRow } from '@/types/admin-users'
import type { ProgrammeOption } from '@/services/student-form-queries'
import { adminCreateUser } from '@/app/(portal)/admin/users/actions'

type Role = 'STUDENT' | 'LECTURER' | 'ADMIN'

type Props = {
  programmes: ProgrammeOption[]
  onSuccess: (newUser: UserPageRow) => void
  onClose: () => void
}

// Shared inline style — bg-[--bg-surface] is unreliable in Tailwind v4 arbitrary-value syntax.
const INPUT_STYLE: React.CSSProperties = { backgroundColor: 'var(--bg-surface)' }
const INPUT_CLASS =
  'w-full rounded-md border border-[--ucsi-border] px-3 py-1.5 text-sm text-[--text-primary] placeholder:text-[--text-muted] focus:outline-none focus:ring-1 focus:ring-[--ucsi-red] disabled:opacity-50'
const LABEL_CLASS = 'text-xs font-medium text-[--text-secondary]'

// Compact labelled field for the dense student profile group.
function Field({
  name,
  label,
  type = 'text',
  required = true,
  maxLength,
  placeholder,
  defaultValue,
  disabled,
}: {
  name: string
  label: string
  type?: string
  required?: boolean
  maxLength?: number
  placeholder?: string
  defaultValue?: string
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={`cu-${name}`} className={LABEL_CLASS}>{label}</label>
      <input
        id={`cu-${name}`}
        name={name}
        type={type}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        defaultValue={defaultValue}
        disabled={disabled}
        className={INPUT_CLASS}
        style={INPUT_STYLE}
      />
    </div>
  )
}

export function CreateUserModal({ programmes, onSuccess, onClose }: Props) {
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
        ...(role === 'STUDENT' && {
          student: {
            studentNumber: get('studentNumber'),
            fullName: get('fullName'),
            dateOfBirth: get('dateOfBirth'),
            gender: get('gender') as 'MALE' | 'FEMALE' | 'OTHER',
            nationality: get('nationality'),
            maritalStatus: get('maritalStatus') as 'SINGLE' | 'MARRIED' | 'OTHER',
            mobile: get('mobile'),
            guardianName: get('guardianName'),
            guardianRelation: get('guardianRelation'),
            addressLine1: get('addressLine1'),
            addressLine2: get('addressLine2'),
            city: get('city'),
            state: get('state'),
            postcode: get('postcode'),
            country: get('country'),
            programmeId: get('programmeId'),
            fileNumber: get('fileNumber'),
            intakeDate: get('intakeDate'),
            expectedGradDate: get('expectedGradDate'),
            admitDate: get('admitDate'),
            enrollmentStatus: get('enrollmentStatus') as
              | 'ACTIVE'
              | 'COMPLETED'
              | 'WITHDRAWN'
              | 'DEFERRED',
          },
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

  const isStudent = role === 'STUDENT'

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-user-title"
    >
      <div
        className={`flex max-h-[90vh] w-full flex-col rounded-xl shadow-xl ${isStudent ? 'max-w-2xl' : 'max-w-md'}`}
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[--ucsi-border] px-6 py-4">
          <div>
            <h2 id="create-user-title" className="text-sm font-semibold text-[--text-primary]">
              Create User Account
            </h2>
            <p className="mt-0.5 text-xs text-[--text-secondary]">
              {isStudent
                ? 'Create the account and full student profile in one step.'
                : 'Profile details can be assigned after account creation.'}
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

        {/* Form (scrollable body) */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
          <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">

            {/* Role */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cu-role" className={LABEL_CLASS}>Role</label>
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
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                name="username"
                label={role === 'STUDENT' ? 'Username' : 'Username (used for login)'}
                maxLength={50}
                placeholder={role === 'STUDENT' ? 'e.g. stu015' : 'e.g. sarah.tan'}
                disabled={isPending}
              />
              <Field
                name="emailInstitutional"
                label={role === 'STUDENT' ? 'Institutional Email (login)' : 'Institutional Email'}
                type="email"
                maxLength={100}
                placeholder={role === 'STUDENT' ? '2002400XXX@ucsicollege.edu.my' : 'name@ucsicollege.edu.my'}
                disabled={isPending}
              />
            </div>
            <Field
              name="password"
              label="Temporary Password"
              type="password"
              maxLength={128}
              placeholder="Min. 8 characters"
              disabled={isPending}
            />

            {/* Lecturer profile fields */}
            {role === 'LECTURER' && (
              <fieldset className="flex flex-col gap-3 rounded-lg border border-[--ucsi-border] px-4 py-3">
                <legend className="px-1 text-[11px] font-medium uppercase tracking-wide text-[--text-muted]">Lecturer Profile</legend>
                <Field name="fullName" label="Full Name" maxLength={150} placeholder="e.g. Dr. Sarah Tan" disabled={isPending} />
                <div className="grid grid-cols-2 gap-3">
                  <Field name="staffNumber" label="Staff Number" maxLength={30} placeholder="e.g. LEC006" disabled={isPending} />
                  <Field name="department" label="Department" maxLength={100} placeholder="e.g. School of IT" disabled={isPending} />
                </div>
              </fieldset>
            )}

            {/* Student profile fields */}
            {isStudent && (
              <>
                <fieldset className="flex flex-col gap-3 rounded-lg border border-[--ucsi-border] px-4 py-3">
                  <legend className="px-1 text-[11px] font-medium uppercase tracking-wide text-[--text-muted]">Identity</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field name="fullName" label="Full Name" maxLength={150} placeholder="e.g. Ahmad bin Ismail" disabled={isPending} />
                    <Field name="studentNumber" label="Student Number" maxLength={20} placeholder="e.g. 2002400123" disabled={isPending} />
                    <Field name="dateOfBirth" label="Date of Birth" type="date" disabled={isPending} />
                    <div className="flex flex-col gap-1">
                      <label htmlFor="cu-gender" className={LABEL_CLASS}>Gender</label>
                      <select id="cu-gender" name="gender" required disabled={isPending} className={INPUT_CLASS} style={INPUT_STYLE} defaultValue="MALE">
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <Field name="nationality" label="Nationality" maxLength={80} placeholder="e.g. Malaysian" disabled={isPending} />
                    <div className="flex flex-col gap-1">
                      <label htmlFor="cu-maritalStatus" className={LABEL_CLASS}>Marital Status</label>
                      <select id="cu-maritalStatus" name="maritalStatus" required disabled={isPending} className={INPUT_CLASS} style={INPUT_STYLE} defaultValue="SINGLE">
                        <option value="SINGLE">Single</option>
                        <option value="MARRIED">Married</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>
                </fieldset>

                <fieldset className="flex flex-col gap-3 rounded-lg border border-[--ucsi-border] px-4 py-3">
                  <legend className="px-1 text-[11px] font-medium uppercase tracking-wide text-[--text-muted]">Contact &amp; Guardian</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field name="mobile" label="Mobile" maxLength={20} placeholder="e.g. 012-3456789" disabled={isPending} />
                    <Field name="guardianName" label="Guardian Name" maxLength={150} placeholder="e.g. Ismail bin Abu" disabled={isPending} />
                    <Field name="guardianRelation" label="Guardian Relation" maxLength={80} placeholder="e.g. Father" disabled={isPending} />
                  </div>
                </fieldset>

                <fieldset className="flex flex-col gap-3 rounded-lg border border-[--ucsi-border] px-4 py-3">
                  <legend className="px-1 text-[11px] font-medium uppercase tracking-wide text-[--text-muted]">Address</legend>
                  <Field name="addressLine1" label="Address Line 1" maxLength={200} placeholder="e.g. 12 Jalan Mawar" disabled={isPending} />
                  <Field name="addressLine2" label="Address Line 2 (optional)" required={false} maxLength={200} placeholder="e.g. Taman Seri" disabled={isPending} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field name="city" label="City" maxLength={100} placeholder="e.g. Kuala Lumpur" disabled={isPending} />
                    <Field name="state" label="State" maxLength={100} placeholder="e.g. Selangor" disabled={isPending} />
                    <Field name="postcode" label="Postcode" maxLength={20} placeholder="e.g. 50000" disabled={isPending} />
                    <Field name="country" label="Country" maxLength={80} defaultValue="Malaysia" disabled={isPending} />
                  </div>
                </fieldset>

                <fieldset className="flex flex-col gap-3 rounded-lg border border-[--ucsi-border] px-4 py-3">
                  <legend className="px-1 text-[11px] font-medium uppercase tracking-wide text-[--text-muted]">Programme Enrollment</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="cu-programmeId" className={LABEL_CLASS}>Programme</label>
                      <select id="cu-programmeId" name="programmeId" required disabled={isPending} className={INPUT_CLASS} style={INPUT_STYLE} defaultValue="">
                        <option value="" disabled>Select a programme…</option>
                        {programmes.map((p) => (
                          <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                        ))}
                      </select>
                    </div>
                    <Field name="fileNumber" label="File Number" maxLength={50} placeholder="e.g. F2024-0123" disabled={isPending} />
                    <Field name="intakeDate" label="Intake Date" type="date" disabled={isPending} />
                    <Field name="admitDate" label="Admit Date" type="date" disabled={isPending} />
                    <Field name="expectedGradDate" label="Expected Graduation" type="date" disabled={isPending} />
                    <div className="flex flex-col gap-1">
                      <label htmlFor="cu-enrollmentStatus" className={LABEL_CLASS}>Enrollment Status</label>
                      <select id="cu-enrollmentStatus" name="enrollmentStatus" required disabled={isPending} className={INPUT_CLASS} style={INPUT_STYLE} defaultValue="ACTIVE">
                        <option value="ACTIVE">Active</option>
                        <option value="DEFERRED">Deferred</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="WITHDRAWN">Withdrawn</option>
                      </select>
                    </div>
                  </div>
                </fieldset>
              </>
            )}

            {/* Admin notice */}
            {role === 'ADMIN' && (
              <p className="rounded-md bg-zinc-50 px-3 py-2.5 text-[11px] text-[--text-secondary] dark:bg-white/5">
                Admin accounts don&apos;t require a separate profile — only account credentials are needed.
              </p>
            )}

            {/* Error */}
            {error && <p className="text-xs text-red-500" role="alert">{error}</p>}
          </div>

          {/* Action buttons (pinned footer) */}
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
              {isPending ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
