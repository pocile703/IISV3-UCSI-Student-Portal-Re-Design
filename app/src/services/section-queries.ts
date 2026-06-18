import { prisma } from '@/lib/prisma'
import type { SectionPageRow, SectionFormData, SectionStats } from '@/types/admin-sections'

export async function getSectionsData(): Promise<{ rows: SectionPageRow[]; stats: SectionStats }> {
  const sections = await prisma.courseSection.findMany({
    select: {
      id: true,
      courseId: true,
      sectionCode: true,
      room: true,
      dayOfWeek: true,
      timeStart: true,
      timeEnd: true,
      maxCapacity: true,
      isActive: true,
      course: { select: { code: true, title: true } },
      semester: { select: { id: true, name: true } },
      teachingAssignments: {
        select: { lecturerId: true, lecturer: { select: { fullName: true } } },
        orderBy: { assignedAt: 'asc' },
        take: 1,
      },
      // Fetch enrolled students for count — filter ENROLLED status in JS (avoids
      // Prisma _count nested-where compatibility uncertainty across adapter versions)
      studentEnrollments: {
        where: { status: 'ENROLLED' },
        select: { id: true },
      },
    },
    orderBy: [
      { semester: { startDate: 'desc' } },
      { dayOfWeek: 'asc' },
      { timeStart: 'asc' },
    ],
  })

  const rows: SectionPageRow[] = sections.map((s) => ({
    id: s.id,
    courseId: s.courseId,
    sectionCode: s.sectionCode,
    courseCode: s.course.code,
    courseTitle: s.course.title,
    semesterId: s.semester.id,
    semesterName: s.semester.name,
    room: s.room,
    dayOfWeek: s.dayOfWeek,
    timeStart: (s.timeStart as Date).toISOString().slice(11, 16),
    timeEnd: (s.timeEnd as Date).toISOString().slice(11, 16),
    maxCapacity: s.maxCapacity,
    enrolledCount: s.studentEnrollments.length,
    isActive: s.isActive,
    lecturerId: s.teachingAssignments[0]?.lecturerId ?? null,
    lecturerName: s.teachingAssignments[0]?.lecturer.fullName ?? null,
  }))

  const stats: SectionStats = {
    totalActive: rows.filter((r) => r.isActive).length,
    totalInactive: rows.filter((r) => !r.isActive).length,
    totalAssignments: rows.filter((r) => r.lecturerId !== null).length,
    totalSeatsUsed: rows.reduce((sum, r) => sum + r.enrolledCount, 0),
  }

  return { rows, stats }
}

export async function getSectionFormData(): Promise<SectionFormData> {
  const [courses, semesters, lecturers] = await Promise.all([
    prisma.course.findMany({
      where: { isActive: true },
      select: { id: true, code: true, title: true },
      orderBy: { code: 'asc' },
    }),
    prisma.semester.findMany({
      select: { id: true, name: true, programme: { select: { code: true } } },
      orderBy: { startDate: 'desc' },
    }),
    prisma.lecturer.findMany({
      where: { user: { isActive: true } },
      select: { id: true, fullName: true },
      orderBy: { fullName: 'asc' },
    }),
  ])

  return {
    courses: courses.map((c) => ({ id: c.id, label: `${c.code} – ${c.title}` })),
    semesters: semesters.map((s) => ({
      id: s.id,
      label: `${s.name} (${s.programme.code})`,
    })),
    lecturers: lecturers.map((l) => ({ id: l.id, label: l.fullName })),
  }
}
