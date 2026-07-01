'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, UserMinus, UserPlus } from 'lucide-react'
import {
  loadSectionEnrollment,
  adminEnrollStudent,
  adminDropStudent,
} from '@/app/(portal)/admin/sections/enrollment-actions'
import type { SectionEnrollmentData } from '@/types/admin-enrollment'

type Props = {
  sectionId: string
  onClose: () => void
}

const INPUT_STYLE: React.CSSProperties = { backgroundColor: 'var(--bg-surface)' }

export function SectionEnrollmentModal({ sectionId, onClose }: Props) {
  const router = useRouter()
  const [data, setData] = useState<SectionEnrollmentData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState('')
  const [isPending, startTransition] = useTransition()

  // Load (and reload after each mutation) the roster + eligible list.
  function refresh() {
    return loadSectionEnrollment(sectionId).then((res) => {
      if ('error' in res) setLoadError(res.error)
      else {
        setData(res.data)
        setLoadError(null)
      }
    })
  }

  useEffect(() => {
    let cancelled = false
    loadSectionEnrollment(sectionId).then((res) => {
      if (cancelled) return
      if ('error' in res) setLoadError(res.error)
      else setData(res.data)
    })
    return () => {
      cancelled = true
    }
  }, [sectionId])

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

  function handleAdd() {
    if (!selected) return
    setError(null)
    startTransition(async () => {
      const res = await adminEnrollStudent(sectionId, selected)
      if (!res.success) {
        setError(res.error ?? 'Failed to add student.')
        return
      }
      setSelected('')
      await refresh()
      router.refresh()
    })
  }

  function handleRemove(studentId: string) {
    setError(null)
    startTransition(async () => {
      const res = await adminDropStudent(sectionId, studentId)
      if (!res.success) {
        setError(res.error ?? 'Failed to remove student.')
        return
      }
      await refresh()
      router.refresh()
    })
  }

  const atCapacity = data ? data.enrolledCount >= data.maxCapacity : false

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enroll-title"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-xl shadow-xl"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[--ucsi-border] px-6 py-4">
          <div>
            <h2 id="enroll-title" className="text-sm font-semibold text-[--text-primary]">
              Manage Students
            </h2>
            <p className="mt-0.5 text-xs text-[--text-secondary]">
              {data ? (
                <>
                  {data.courseCode} · Sec {data.sectionCode}
                  <span className="ml-2 font-mono">
                    {data.enrolledCount} / {data.maxCapacity} enrolled
                  </span>
                </>
              ) : (
                'Loading…'
              )}
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
          <div className="px-6 py-8 text-sm text-red-500" role="alert">
            {loadError}
          </div>
        ) : !data ? (
          <div className="px-6 py-8 text-sm text-[--text-muted]">Loading roster…</div>
        ) : (
          <div className="flex min-h-0 flex-col gap-5 overflow-y-auto px-6 py-5">
            {/* Add student */}
            <section className="flex flex-col gap-2">
              <label htmlFor="enroll-select" className="text-xs font-semibold text-[--text-primary]">
                Add a student
              </label>
              <div className="flex gap-2">
                <select
                  id="enroll-select"
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  disabled={isPending || atCapacity || data.eligible.length === 0}
                  className="min-w-0 flex-1 rounded-md border border-[--ucsi-border] px-3 py-1.5 text-sm text-[--text-primary] focus:outline-none focus:ring-1 focus:ring-[--ucsi-red] disabled:opacity-50"
                  style={INPUT_STYLE}
                >
                  <option value="">
                    {data.eligible.length === 0
                      ? 'No eligible students in this programme'
                      : 'Select a student…'}
                  </option>
                  {data.eligible.map((s) => (
                    <option key={s.studentId} value={s.studentId}>
                      {s.fullName} · {s.studentNumber}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={isPending || !selected || atCapacity}
                  className="flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: 'var(--ucsi-red)' }}
                >
                  <UserPlus size={14} aria-hidden="true" />
                  Add
                </button>
              </div>
              {atCapacity && (
                <p className="text-[11px] text-amber-600 dark:text-amber-500">
                  Section is at full capacity — remove a student before adding another.
                </p>
              )}
            </section>

            {/* Enrolled roster */}
            <section className="flex flex-col gap-2 border-t border-[--ucsi-border] pt-4">
              <h3 className="text-xs font-semibold text-[--text-primary]">
                Enrolled students ({data.enrolled.length})
              </h3>
              {data.enrolled.length === 0 ? (
                <p className="text-sm text-[--text-muted]">No students enrolled yet.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-[--ucsi-border]">
                  {data.enrolled.map((s) => (
                    <li key={s.studentId} className="flex items-center justify-between py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[--text-primary]">
                          {s.fullName}
                        </p>
                        <p className="truncate font-mono text-xs text-[--text-secondary]">
                          {s.studentNumber}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(s.studentId)}
                        disabled={isPending}
                        aria-label={`Remove ${s.fullName}`}
                        className="flex cursor-pointer items-center gap-1.5 rounded-md border border-[#C1272D]/30 px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ color: 'var(--ucsi-red)' }}
                      >
                        <UserMinus size={14} aria-hidden="true" />
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {error && (
              <p className="text-xs text-red-500" role="alert">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[--ucsi-border] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-md border border-[--ucsi-border] px-4 py-1.5 text-xs font-medium text-[--text-secondary] hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-white/10"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
