'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SectionPageRow, SectionFormData } from '@/types/admin-sections'
import {
  adminCreateSection,
  adminUpdateSection,
} from '@/app/(portal)/admin/sections/actions'

type ActionState = { error?: string; success?: boolean }

type Props = {
  mode: 'create' | 'edit'
  section?: SectionPageRow   // required when mode='edit'
  formData: SectionFormData  // courses + semesters + lecturers for selects
  onClose: () => void
}

const INPUT_STYLE: React.CSSProperties = { backgroundColor: 'var(--bg-surface)' }

const INPUT_CLS =
  'w-full rounded-md border border-[--ucsi-border] bg-transparent px-3 py-1.5 text-sm ' +
  'text-[--text-primary] focus:outline-none focus:ring-2 focus:ring-[#C1272D]/50'

const DAY_OPTIONS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
]

export function SectionModal({ mode, section, formData, onClose }: Props) {
  const router = useRouter()

  // Controlled only for the isActive select — needed to show deactivation warning
  const [statusValue, setStatusValue] = useState<'true' | 'false'>(
    section?.isActive === false ? 'false' : 'true',
  )

  // Bind sectionId for edit mode — .bind() widens the return type, so cast explicitly
  const action =
    mode === 'create'
      ? adminCreateSection
      : (adminUpdateSection.bind(null, section!.id) as (
          prev: ActionState,
          fd: FormData,
        ) => Promise<ActionState>)

  const [state, dispatch, isPending] = useActionState<ActionState, FormData>(action, {})

  // Close and refresh on success
  useEffect(() => {
    if (state.success) {
      router.refresh()
      onClose()
    }
  }, [state.success, router, onClose])

  // Escape key — blocked while mutation is in flight
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isPending, onClose])

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!isPending && e.currentTarget === e.target) onClose()
  }

  const showDeactivationWarning =
    mode === 'edit' && section?.isActive === true && statusValue === 'false'

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="section-modal-title"
    >
      <div
        className="w-full max-w-lg overflow-y-auto rounded-xl shadow-xl"
        style={{ backgroundColor: 'var(--bg-surface)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[--ucsi-border] px-5 py-4">
          <h2
            id="section-modal-title"
            className="text-sm font-semibold text-[--text-primary]"
          >
            {mode === 'create' ? 'Add Section' : 'Edit Section'}
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
          {/* Semester */}
          <div>
            <label className="mb-1 block text-xs font-medium text-[--text-secondary]">
              Semester
            </label>
            <select
              name="semesterId"
              required
              autoFocus
              defaultValue={section?.semesterId ?? ''}
              className={INPUT_CLS}
              style={INPUT_STYLE}
            >
              <option value="" disabled>
                Select semester…
              </option>
              {formData.semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Course */}
          <div>
            <label className="mb-1 block text-xs font-medium text-[--text-secondary]">
              Course
            </label>
            <select
              name="courseId"
              required
              defaultValue={section?.courseId ?? ''}
              className={INPUT_CLS}
              style={INPUT_STYLE}
            >
              <option value="" disabled>
                Select course…
              </option>
              {formData.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Section Code + Room */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[--text-secondary]">
                Section Code
              </label>
              <input
                type="text"
                name="sectionCode"
                required
                maxLength={20}
                defaultValue={section?.sectionCode ?? ''}
                placeholder="A"
                className={INPUT_CLS}
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[--text-secondary]">
                Room
              </label>
              <input
                type="text"
                name="room"
                maxLength={50}
                defaultValue={section?.room ?? ''}
                placeholder="e.g. A-301"
                className={INPUT_CLS}
                style={INPUT_STYLE}
              />
            </div>
          </div>

          {/* Day of Week */}
          <div>
            <label className="mb-1 block text-xs font-medium text-[--text-secondary]">
              Day of Week
            </label>
            <select
              name="dayOfWeek"
              required
              defaultValue={section?.dayOfWeek?.toString() ?? ''}
              className={INPUT_CLS}
              style={INPUT_STYLE}
            >
              <option value="" disabled>
                Select day…
              </option>
              {DAY_OPTIONS.map((day, i) => (
                <option key={i} value={i}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          {/* Start Time + End Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[--text-secondary]">
                Start Time
              </label>
              <input
                type="time"
                name="timeStart"
                required
                defaultValue={section?.timeStart ?? ''}
                className={INPUT_CLS}
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[--text-secondary]">
                End Time
              </label>
              <input
                type="time"
                name="timeEnd"
                required
                defaultValue={section?.timeEnd ?? ''}
                className={INPUT_CLS}
                style={INPUT_STYLE}
              />
            </div>
          </div>

          {/* Max Capacity + Lecturer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[--text-secondary]">
                Max Capacity
              </label>
              <input
                type="number"
                name="maxCapacity"
                required
                min={1}
                max={500}
                defaultValue={section?.maxCapacity?.toString() ?? ''}
                className={INPUT_CLS}
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[--text-secondary]">
                Assigned Lecturer
              </label>
              <select
                name="lecturerId"
                defaultValue={section?.lecturerId ?? ''}
                className={INPUT_CLS}
                style={INPUT_STYLE}
              >
                <option value="">None (unassigned)</option>
                {formData.lecturers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status — edit mode only */}
          {mode === 'edit' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-[--text-secondary]">
                Status
              </label>
              <select
                name="isActive"
                value={statusValue}
                onChange={(e) =>
                  setStatusValue(e.target.value as 'true' | 'false')
                }
                className={INPUT_CLS}
                style={INPUT_STYLE}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          )}

          {/* Deactivation warning */}
          {showDeactivationWarning && (
            <div className="rounded-md bg-amber-50 px-4 py-3 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
              Deactivating this section will hide it from student and lecturer timetable views.
            </div>
          )}

          {/* Error */}
          {state.error && (
            <p className="text-xs text-red-500" role="alert">
              {state.error}
            </p>
          )}

          {/* Buttons */}
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
                  ? 'Add Section'
                  : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
