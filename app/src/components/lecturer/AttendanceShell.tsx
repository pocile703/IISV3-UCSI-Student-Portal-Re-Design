'use client'

import { useState } from 'react'
import { AttendanceDatePanel } from './AttendanceDatePanel'
import { AttendanceRosterPanel } from './AttendanceRosterPanel'
import type { StudentRoster, AttendanceRecord, AttendanceStatus } from '@/types/attendance'

type AttendanceState = { error?: string; success?: boolean }

interface AttendanceShellProps {
  sectionId: string
  sessionDates: string[]
  roster: StudentRoster[]
  initialRecords: AttendanceRecord[]
  semesterStartDate: string
  saveAttendanceAction: (_prev: AttendanceState, formData: FormData) => Promise<AttendanceState>
}

function findDefaultDate(
  sessionDates: string[],
  records: AttendanceRecord[],
  sectionId: string,
): string {
  const markedDates = new Set(
    records.filter((r) => r.sectionId === sectionId).map((r) => r.date),
  )
  const today = new Date().toISOString().split('T')[0]
  const pastDates = sessionDates.filter((d) => d <= today)
  const firstPending = [...pastDates].reverse().find((d) => !markedDates.has(d))
  return firstPending ?? pastDates[pastDates.length - 1] ?? sessionDates[0]
}

function initEntries(
  date: string,
  sectionId: string,
  records: AttendanceRecord[],
  roster: StudentRoster[],
): Record<string, AttendanceStatus | null> {
  const record = records.find((r) => r.sectionId === sectionId && r.date === date)
  return Object.fromEntries(
    roster.map((s) => [
      s.studentId,
      record?.entries.find((e) => e.studentId === s.studentId)?.status ?? null,
    ]),
  )
}

export function AttendanceShell({
  sectionId,
  sessionDates,
  roster,
  initialRecords,
  semesterStartDate,
  saveAttendanceAction,
}: AttendanceShellProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords)
  const [selectedDate, setSelectedDate] = useState(() =>
    findDefaultDate(sessionDates, initialRecords, sectionId),
  )
  const [entries, setEntries] = useState<Record<string, AttendanceStatus | null>>(() =>
    initEntries(selectedDate, sectionId, initialRecords, roster),
  )

  const markedDates = new Set(
    records.filter((r) => r.sectionId === sectionId).map((r) => r.date),
  )

  function handleSelectDate(date: string) {
    setSelectedDate(date)
    setEntries(initEntries(date, sectionId, records, roster))
  }

  function handleEntryChange(studentId: string, status: AttendanceStatus | null) {
    setEntries((prev) => ({ ...prev, [studentId]: status }))
  }

  function handleMarkAllPresent() {
    setEntries((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([id, status]) => [id, status ?? 'present']),
      ),
    )
  }

  // Called by AttendanceRosterPanel after a confirmed save.
  // Optimistically marks the selected date as Done so the date panel badge flips immediately.
  // router.refresh() inside AttendanceRosterPanel re-syncs server truth; the snapshot key
  // on the page then remounts this shell with fresh initialRecords.
  function handleSaveSuccess() {
    const submittedEntries = Object.entries(entries)
      .filter((e): e is [string, AttendanceStatus] => e[1] !== null)
      .map(([studentId, status]) => ({ studentId, status }))
    setRecords((prev) => {
      const without = prev.filter(
        (r) => !(r.sectionId === sectionId && r.date === selectedDate),
      )
      return [...without, { sectionId, date: selectedDate, entries: submittedEntries }]
    })
  }

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[260px_1fr]">
      <AttendanceDatePanel
        sessionDates={sessionDates}
        markedDates={markedDates}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        semesterStartDate={semesterStartDate}
      />
      <AttendanceRosterPanel
        roster={roster}
        selectedDate={selectedDate}
        entries={entries}
        onEntryChange={handleEntryChange}
        onMarkAllPresent={handleMarkAllPresent}
        onSaveSuccess={handleSaveSuccess}
        saveAction={saveAttendanceAction}
      />
    </div>
  )
}
