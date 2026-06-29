// View-model types for the lecturer attendance roster UI.
// (Previously lived in data/mock-attendance.ts — moved here when the attendance
// pages went fully Prisma-backed. The shapes are display-only, not DB rows.)

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export interface StudentRoster {
  studentId: string
  studentNumber: string
  name: string
}

export interface AttendanceEntry {
  studentId: string
  status: AttendanceStatus
}

export interface AttendanceRecord {
  sectionId: string
  date: string // YYYY-MM-DD
  entries: AttendanceEntry[]
}
