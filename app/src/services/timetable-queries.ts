// Server-only Prisma queries for the Timetable page.
import { prisma } from '@/lib/prisma'
import { toTime } from '@/lib/query-helpers'
import { SectionEnrollmentStatus } from '@prisma/client'
import type { Course, CourseSection } from '@/types/academic'

export interface TimetableAttendanceRecord {
  sectionId: string
  date: string    // "YYYY-MM-DD"
  status: 'present' | 'absent' | 'late' | 'excused'
}

export interface TimetablePageData {
  semesterName: string
  sections: CourseSection[]
  courses: Course[]
  lecturerNames: Record<string, string | null>
  attendance: TimetableAttendanceRecord[]
}

export async function getTimetableData(studentId: string): Promise<TimetablePageData> {
  // ── 1. Enrolled sections in the current semester ──────────────────────────
  const enrollments = await prisma.studentSectionEnrollment.findMany({
    where: {
      studentId,
      status: SectionEnrollmentStatus.ENROLLED,
      courseSection: { semester: { isCurrent: true } },
    },
    select: {
      courseSection: {
        select: {
          id: true,
          courseId: true,
          semesterId: true,
          sectionCode: true,
          room: true,
          dayOfWeek: true,
          timeStart: true,
          timeEnd: true,
          course: {
            select: { id: true, code: true, title: true, credits: true, type: true },
          },
          semester: {
            select: { name: true },
          },
          teachingAssignments: {
            select: { lecturer: { select: { fullName: true } } },
            orderBy: { assignedAt: 'asc' },
            take: 1,
          },
        },
      },
    },
  })

  if (enrollments.length === 0) {
    return { semesterName: '', sections: [], courses: [], lecturerNames: {}, attendance: [] }
  }

  const semesterName = enrollments[0].courseSection.semester.name

  const sections: CourseSection[] = enrollments.map((e) => {
    const cs = e.courseSection
    return {
      id: cs.id,
      courseId: cs.courseId,
      semesterId: cs.semesterId,
      sectionCode: cs.sectionCode,
      room: cs.room ?? undefined,
      dayOfWeek: cs.dayOfWeek + 1, // DB: 0=Mon → UI: 1=Mon
      timeStart: toTime(cs.timeStart),
      timeEnd: toTime(cs.timeEnd),
    }
  })

  const courses: Course[] = enrollments.map((e) => {
    const c = e.courseSection.course
    return {
      id: c.id,
      code: c.code,
      title: c.title,
      credits: Number(c.credits),
      type: c.type.toLowerCase() as Course['type'],
    }
  })

  const lecturerNames: Record<string, string | null> = {}
  for (const e of enrollments) {
    const ta = e.courseSection.teachingAssignments[0]
    lecturerNames[e.courseSection.id] = ta?.lecturer?.fullName ?? null
  }

  // ── 2. Attendance for enrolled sections ───────────────────────────────────
  const sectionIds = enrollments.map((e) => e.courseSection.id)
  const dbAttendance = await prisma.attendance.findMany({
    where: { studentId, courseSectionId: { in: sectionIds } },
    select: { courseSectionId: true, date: true, status: true },
    orderBy: { date: 'desc' },
  })

  const attendance: TimetableAttendanceRecord[] = dbAttendance.map((a) => ({
    sectionId: a.courseSectionId,
    date: a.date.toISOString().split('T')[0],
    status: a.status.toLowerCase() as TimetableAttendanceRecord['status'],
  }))

  return { semesterName, sections, courses, lecturerNames, attendance }
}
