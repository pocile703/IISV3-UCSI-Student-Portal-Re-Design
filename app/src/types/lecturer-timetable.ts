// View-model types for the lecturer Timetable page (Prisma-backed).
// Mirrors the fields the page renders — narrow on purpose (no overfetch).

export interface LecturerTeachingSession {
  sectionId: string
  sectionCode: string
  courseCode: string
  courseTitle: string
  room: string
  dayOfWeek: number // 1=Mon … 7=Sun (UI convention; DB stores 0=Mon)
  timeStart: string // "HH:MM"
  timeEnd: string // "HH:MM"
  studentCount: number
}

export interface LecturerTimetableData {
  semesterName: string
  sessions: LecturerTeachingSession[]
}
