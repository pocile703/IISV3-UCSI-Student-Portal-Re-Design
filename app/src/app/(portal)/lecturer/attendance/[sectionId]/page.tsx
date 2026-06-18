import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AttendanceShell } from '@/components/lecturer/AttendanceShell'
import { saveAttendance } from './actions'
import type { AttendanceState } from './actions'
import {
  generateSessionDates,
  type StudentRoster,
  type AttendanceRecord,
  type AttendanceStatus,
} from '@/data/mock-attendance'

// Section metadata shape shared by both the lecturer and admin fetch paths.
type SectionData = {
  sectionCode: string
  room: string | null
  dayOfWeek: number
  semester: { startDate: Date; endDate: Date }
  course: { code: string; title: string }
}

export default async function LecturerAttendanceDetailPage({
  params,
}: {
  params: Promise<{ sectionId: string }>
}) {
  const session = await auth()
  const isAdmin = session?.user?.role === 'admin'
  const lecturerId = session?.user?.lecturerId
  // Admin may reach this page via the proxy exception; lecturer requires an ID.
  if (!isAdmin && (!lecturerId || session?.user?.role !== 'lecturer')) redirect('/login')

  const { sectionId } = await params

  // Fetch section metadata + semester bounds.
  // Admin: direct courseSection lookup, no TeachingAssignment required.
  // Lecturer: TeachingAssignment gate — redirects if not assigned to this section.
  let cs: SectionData

  if (isAdmin) {
    const section = await prisma.courseSection.findUnique({
      where: { id: sectionId },
      select: {
        sectionCode: true,
        room: true,
        dayOfWeek: true,
        semester: { select: { startDate: true, endDate: true } },
        course: { select: { code: true, title: true } },
      },
    })
    if (!section) redirect('/admin')
    cs = section
  } else {
    const assignment = await prisma.teachingAssignment.findUnique({
      where: {
        lecturerId_courseSectionId: { lecturerId: lecturerId!, courseSectionId: sectionId },
      },
      select: {
        courseSection: {
          select: {
            sectionCode: true,
            room: true,
            dayOfWeek: true,
            semester: { select: { startDate: true, endDate: true } },
            course: { select: { code: true, title: true } },
          },
        },
      },
    })
    if (!assignment) redirect('/lecturer/attendance')
    cs = assignment.courseSection
  }

  // Fetch enrolled students and existing attendance in parallel.
  const [enrollments, attendanceRows] = await Promise.all([
    prisma.studentSectionEnrollment.findMany({
      where: { courseSectionId: sectionId, status: 'ENROLLED' },
      select: {
        student: { select: { id: true, studentNumber: true, fullName: true } },
      },
      orderBy: { student: { fullName: 'asc' } },
    }),
    prisma.attendance.findMany({
      where: { courseSectionId: sectionId },
      select: { studentId: true, date: true, status: true },
      orderBy: { date: 'asc' },
    }),
  ])

  const roster: StudentRoster[] = enrollments.map((e) => ({
    studentId: e.student.id,
    studentNumber: e.student.studentNumber,
    name: e.student.fullName,
  }))

  // Group attendance rows by date → AttendanceRecord[].
  // DB status is uppercase (PRESENT) → lowercase to match frontend AttendanceStatus.
  const recordMap = new Map<string, Array<{ studentId: string; status: AttendanceStatus }>>()
  for (const row of attendanceRows) {
    const dateStr = (row.date as Date).toISOString().split('T')[0]
    if (!recordMap.has(dateStr)) recordMap.set(dateStr, [])
    recordMap.get(dateStr)!.push({
      studentId: row.studentId,
      status: row.status.toLowerCase() as AttendanceStatus,
    })
  }
  const initialRecords: AttendanceRecord[] = [...recordMap.entries()].map(([date, entries]) => ({
    sectionId,
    date,
    entries,
  }))

  // DB dayOfWeek: 0=Mon…6=Sun → generateSessionDates ISO: 1=Mon…7=Sun
  const isoDow = cs.dayOfWeek + 1
  const startDate = (cs.semester.startDate as Date).toISOString().split('T')[0]
  const endDate = (cs.semester.endDate as Date).toISOString().split('T')[0]
  const sessionDates = generateSessionDates(isoDow, startDate, endDate)

  // Snapshot key: triggers AttendanceShell remount when server data changes (Codex pattern).
  // Encodes every (date, studentId, status) triple — changes on any add or update.
  const attendanceSnapshotKey = initialRecords
    .map((r) => `${r.date}:${r.entries.map((e) => `${e.studentId}:${e.status}`).join(',')}`)
    .join('|')

  // Bind sectionId server-side — never let the client supply it via formData.
  const boundSaveAttendance = saveAttendance.bind(null, sectionId) as (
    _prev: AttendanceState,
    formData: FormData,
  ) => Promise<AttendanceState>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[--text-primary]">
          Attendance — {cs.course.code}
        </h1>
        <p className="mt-0.5 text-sm text-[--text-secondary]">
          {cs.course.title} · Section {cs.sectionCode} · {cs.room ?? '—'}
        </p>
      </div>

      <AttendanceShell
        key={attendanceSnapshotKey}
        sectionId={sectionId}
        sessionDates={sessionDates}
        roster={roster}
        initialRecords={initialRecords}
        semesterStartDate={startDate}
        saveAttendanceAction={boundSaveAttendance}
      />
    </div>
  )
}
