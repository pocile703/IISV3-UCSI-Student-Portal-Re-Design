// Server-only Prisma query for the lecturer Timetable page.
// Derived view over TeachingAssignment → CourseSection (current semester only).
// Read-only: timetables are never a table — see CLAUDE.md "Timetable as derived view".
import { prisma } from '@/lib/prisma'
import { toTime } from '@/lib/query-helpers'
import type { LecturerTimetableData, LecturerTeachingSession } from '@/types/lecturer-timetable'

export async function getLecturerTimetableData(
  lecturerId: string,
): Promise<LecturerTimetableData> {
  const assignments = await prisma.teachingAssignment.findMany({
    where: { lecturerId, courseSection: { semester: { isCurrent: true } } },
    select: {
      courseSection: {
        select: {
          id: true,
          sectionCode: true,
          room: true,
          dayOfWeek: true,
          timeStart: true,
          timeEnd: true,
          semester: { select: { name: true } },
          course: { select: { code: true, title: true } },
          _count: {
            select: { studentEnrollments: { where: { status: 'ENROLLED' } } },
          },
        },
      },
    },
  })

  if (assignments.length === 0) {
    return { semesterName: '', sessions: [] }
  }

  const semesterName = assignments[0].courseSection.semester.name

  const sessions: LecturerTeachingSession[] = assignments.map(({ courseSection: cs }) => ({
    sectionId: cs.id,
    sectionCode: cs.sectionCode,
    courseCode: cs.course.code,
    courseTitle: cs.course.title,
    room: cs.room ?? '—',
    dayOfWeek: cs.dayOfWeek + 1, // DB 0=Mon → UI 1=Mon
    timeStart: toTime(cs.timeStart),
    timeEnd: toTime(cs.timeEnd),
    studentCount: cs._count.studentEnrollments,
  }))

  return { semesterName, sessions }
}
