'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StudentRoster, AttendanceStatus } from '@/data/mock-attendance'

type AttendanceState = { error?: string; success?: boolean }

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'P',
  absent:  'A',
  late:    'L',
  excused: 'E',
}

// Distinct active background per status; inactive buttons are always border-only.
const STATUS_ACTIVE_BG: Record<AttendanceStatus, string> = {
  present: '#16a34a', // green-600
  absent:  '#dc2626', // red-600
  late:    '#d97706', // amber-600
  excused: '#2563eb', // blue-600
}

const ALL_STATUSES = Object.keys(STATUS_LABELS) as AttendanceStatus[]

interface AttendanceRosterPanelProps {
  roster: StudentRoster[]
  selectedDate: string
  entries: Record<string, AttendanceStatus | null>
  onEntryChange: (studentId: string, status: AttendanceStatus | null) => void
  onMarkAllPresent: () => void
  onSaveSuccess: () => void
  saveAction: (_prev: AttendanceState, formData: FormData) => Promise<AttendanceState>
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function summarise(entries: Record<string, AttendanceStatus | null>) {
  const counts = { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 }
  for (const s of Object.values(entries)) {
    if (s === null) counts.unmarked++
    else counts[s]++
  }
  return counts
}

export function AttendanceRosterPanel({
  roster,
  selectedDate,
  entries,
  onEntryChange,
  onMarkAllPresent,
  onSaveSuccess,
  saveAction,
}: AttendanceRosterPanelProps) {
  const router = useRouter()
  const [state, dispatch, isPending] = useActionState(saveAction, {})
  const [saved, setSaved] = useState(false)

  // On a successful save: optimistically flip the date badge via the parent callback,
  // show a 2-second confirmation, then refresh to re-sync server truth.
  // The snapshot key on the page remounts this shell with fresh initialRecords.
  useEffect(() => {
    if (!state.success) return
    onSaveSuccess()
    router.refresh()
    const showTimer = setTimeout(() => setSaved(true), 0)
    const hideTimer = setTimeout(() => setSaved(false), 2000)
    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [state.success]) // eslint-disable-line react-hooks/exhaustive-deps

  const summary = summarise(entries)
  const hasAnyEntry = Object.values(entries).some((s) => s !== null)

  // Serialize current entries into the hidden form input.
  const entriesJson = JSON.stringify(
    Object.entries(entries)
      .filter((e): e is [string, AttendanceStatus] => e[1] !== null)
      .map(([studentId, status]) => ({ studentId, status })),
  )

  function handleToggle(studentId: string, status: AttendanceStatus) {
    onEntryChange(studentId, entries[studentId] === status ? null : status)
  }

  return (
    <form
      action={dispatch}
      className="flex flex-col rounded-xl border border-[--ucsi-border] overflow-hidden"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      {/* Hidden inputs — sectionId is bound server-side; only date + entries come from the form. */}
      <input type="hidden" name="date" value={selectedDate} />
      <input type="hidden" name="entries" value={entriesJson} />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[--ucsi-border] px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-[--text-primary]">{formatFullDate(selectedDate)}</p>
          <p className="mt-1 flex flex-wrap gap-x-2 text-xs">
            {summary.present > 0 && (
              <span className="text-green-600">{summary.present} Present</span>
            )}
            {summary.absent > 0 && (
              <span className="text-red-600">{summary.absent} Absent</span>
            )}
            {summary.late > 0 && (
              <span className="text-amber-600">{summary.late} Late</span>
            )}
            {summary.excused > 0 && (
              <span className="text-blue-600">{summary.excused} Excused</span>
            )}
            <span className="text-[--text-secondary]">{summary.unmarked} Not marked</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onMarkAllPresent}
          disabled={isPending}
          className="rounded-lg border border-[--ucsi-border] px-3 py-1.5 text-xs font-medium text-[--text-secondary] transition-colors hover:border-[#C1272D]/40 hover:bg-[--ucsi-red]/15 hover:text-[#C1272D] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]"
        >
          Mark All Present
        </button>
      </div>

      {/* Roster */}
      <div className="flex flex-col divide-y divide-[--ucsi-border] overflow-y-auto">
        {roster.length === 0 ? (
          <p className="py-12 text-center text-sm text-[--text-muted]">
            No students enrolled in this section.
          </p>
        ) : (
          roster.map((student) => {
            const currentStatus = entries[student.studentId] ?? null
            return (
              <div key={student.studentId} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-[--text-secondary]">{student.studentNumber}</p>
                  <p className="text-sm font-medium text-[--text-primary]">{student.name}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {ALL_STATUSES.map((status) => {
                    const isActive = currentStatus === status
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleToggle(student.studentId, status)}
                        disabled={isPending}
                        aria-label={`Mark ${student.name} as ${status}`}
                        aria-pressed={isActive}
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red] disabled:cursor-not-allowed disabled:opacity-50',
                          isActive
                            ? 'text-white'
                            : 'border border-[--ucsi-border] text-[--text-muted] hover:border-[#C1272D]/40 hover:bg-[--ucsi-red]/15 hover:text-[#C1272D]',
                        )}
                        style={isActive ? { backgroundColor: STATUS_ACTIVE_BG[status] } : undefined}
                      >
                        {STATUS_LABELS[status]}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-[--ucsi-border] px-5 py-4">
        {state.error && (
          <span className="flex items-center gap-1 text-sm text-red-600">
            <AlertCircle size={14} aria-hidden="true" />
            {state.error}
          </span>
        )}
        {saved && !state.error && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <Check size={14} aria-hidden="true" />
            Saved
          </span>
        )}
        <button
          type="submit"
          disabled={isPending || !hasAnyEntry}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]"
          style={{ backgroundColor: 'var(--ucsi-red)' }}
        >
          {isPending ? 'Saving…' : 'Save Attendance'}
        </button>
      </div>
    </form>
  )
}
