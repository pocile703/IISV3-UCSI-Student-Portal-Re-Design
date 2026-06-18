// Server-only Prisma queries for the Academic page.
import { prisma } from '@/lib/prisma'
import { GRADE_POINTS, toTime, toISODate } from '@/lib/query-helpers'
import { ProgrammeEnrollmentStatus, SectionEnrollmentStatus } from '@prisma/client'
import type {
  Course,
  CourseSection,
  Semester,
  PastSemesterCourse,
  PastSemesterDetail,
  SectionResult,
} from '@/types/academic'

function gradeToPoint(grade: string): number {
  return GRADE_POINTS[grade] ?? 0
}

export interface AcademicPageData {
  studentNumber: string
  programme: { code: string; name: string; totalCredits: number }
  enrollment: { expectedGradDate: string; status: string }
  cgpa: number
  previousCgpa: number
  totalCreditsEnrolled: number
  semesters: Semester[]
  currentData: {
    courses: Course[]
    sections: CourseSection[]
    results: SectionResult[]
    lecturerNames: Record<string, string | null>
  }
  pastData: PastSemesterDetail[]
}

export async function getAcademicData(studentId: string): Promise<AcademicPageData> {
  // ── 1. Student + active programme enrollment + programme ───────────────────
  // select-only: avoids pulling PII columns (guardian, address, mobile) into memory.
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
    select: {
      studentNumber: true,
      programmeEnrollments: {
        where: { status: ProgrammeEnrollmentStatus.ACTIVE },
        select: {
          expectedGradDate: true,
          status: true,
          programme: {
            select: { id: true, code: true, name: true, totalCredits: true },
          },
        },
        orderBy: { intakeDate: 'desc' },
        take: 1,
      },
    },
  })

  const enrollment = student.programmeEnrollments[0]
  if (!enrollment) {
    throw new Error(`No active programme enrollment for student ${studentId}`)
  }
  const { programme } = enrollment

  // ── 2. All semesters for this programme (chronological) ───────────────────
  const dbSemesters = await prisma.semester.findMany({
    where: { programmeId: programme.id },
    orderBy: [{ academicYear: 'asc' }, { semesterNumber: 'asc' }],
  })

  const currentSem = dbSemesters.find((s) => s.isCurrent) ?? null
  const pastSemIds = dbSemesters.filter((s) => !s.isCurrent).map((s) => s.id)

  // ── 3. Current semester: enrolled sections with course/result/lecturer ─────
  const currentEnrollments = currentSem
    ? await prisma.studentSectionEnrollment.findMany({
        where: {
          studentId,
          status: SectionEnrollmentStatus.ENROLLED,
          courseSection: { semesterId: currentSem.id },
        },
        select: {
          courseSectionId: true,
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
                select: { code: true, title: true, credits: true, type: true },
              },
              teachingAssignments: {
                select: { lecturer: { select: { fullName: true } } },
                orderBy: { assignedAt: 'asc' },
                take: 1,
              },
            },
          },
          result: {
            select: { grade: true, isPublished: true, attendancePercentage: true, standing: true },
          },
        },
      })
    : []

  // ── 4. Past semesters: all ENROLLED sections with result ──────────────────
  const pastEnrollments =
    pastSemIds.length > 0
      ? await prisma.studentSectionEnrollment.findMany({
          where: {
            studentId,
            status: SectionEnrollmentStatus.ENROLLED,
            courseSection: { semesterId: { in: pastSemIds } },
          },
          select: {
            courseSection: {
              select: {
                semesterId: true,
                course: {
                  select: { code: true, title: true, credits: true, type: true },
                },
              },
            },
            result: {
              select: { grade: true, isPublished: true, attendancePercentage: true, standing: true },
            },
          },
        })
      : []

  // ── Map current semester data ──────────────────────────────────────────────

  const courses: Course[] = currentEnrollments.map((e) => ({
    id: e.courseSection.courseId,
    code: e.courseSection.course.code,
    title: e.courseSection.course.title,
    credits: Number(e.courseSection.course.credits),
    type: e.courseSection.course.type.toLowerCase() as Course['type'],
  }))

  const sections: CourseSection[] = currentEnrollments.map((e) => ({
    id: e.courseSectionId,
    courseId: e.courseSection.courseId,
    semesterId: e.courseSection.semesterId,
    sectionCode: e.courseSection.sectionCode,
    room: e.courseSection.room ?? undefined,
    // Schema: dayOfWeek 0 = Monday … 6 = Sunday.
    // UI: DAY_LABELS[dayOfWeek - 1] expects 1-indexed (1 = Monday).
    dayOfWeek: e.courseSection.dayOfWeek + 1,
    timeStart: toTime(e.courseSection.timeStart),
    timeEnd: toTime(e.courseSection.timeEnd),
  }))

  const results: SectionResult[] = currentEnrollments.map((e) => {
    const r = e.result
    // Seed stores grade: '' for unpublished results; treat as null.
    if (!r || !r.isPublished) {
      return {
        sectionId: e.courseSectionId,
        grade: null,
        gradePoint: null,
        attendancePercentage: r ? Number(r.attendancePercentage) : 0,
        standing: r?.standing ?? 'In Progress',
        isPublished: false,
      }
    }
    return {
      sectionId: e.courseSectionId,
      grade: r.grade || null,
      gradePoint: gradeToPoint(r.grade),
      attendancePercentage: Number(r.attendancePercentage),
      standing: r.standing,
      isPublished: true,
    }
  })

  // lecturerNames keyed by sectionId (UUID), matching CourseSection.id in sections[]
  const lecturerNames: Record<string, string | null> = {}
  for (const e of currentEnrollments) {
    const ta = e.courseSection.teachingAssignments[0]
    lecturerNames[e.courseSectionId] = ta?.lecturer.fullName ?? null
  }

  const totalCreditsEnrolled = currentEnrollments.reduce(
    (sum, e) => sum + Number(e.courseSection.course.credits),
    0,
  )

  // ── Past semester data ────────────────────────────────────────────────────

  const pastBySemester = new Map<string, typeof pastEnrollments>()
  for (const e of pastEnrollments) {
    const sid = e.courseSection.semesterId
    if (!pastBySemester.has(sid)) pastBySemester.set(sid, [])
    pastBySemester.get(sid)!.push(e)
  }

  const pastData: PastSemesterDetail[] = []
  for (const sem of dbSemesters.filter((s) => !s.isCurrent)) {
    const enrollments = pastBySemester.get(sem.id) ?? []
    const published = enrollments.filter((e) => e.result?.isPublished)
    if (published.length === 0) continue

    const semCourses: PastSemesterCourse[] = published.map((e) => {
      const r = e.result!
      const gp = gradeToPoint(r.grade)
      return {
        code: e.courseSection.course.code,
        title: e.courseSection.course.title,
        credits: Number(e.courseSection.course.credits),
        type: e.courseSection.course.type.toLowerCase() as PastSemesterCourse['type'],
        grade: r.grade,
        gradePoint: gp,
        attendancePercentage: Number(r.attendancePercentage),
        standing: r.standing,
      }
    })

    const totalCr = semCourses.reduce((s, c) => s + c.credits, 0)
    const gpa =
      totalCr > 0
        ? semCourses.reduce((s, c) => s + c.gradePoint * c.credits, 0) / totalCr
        : 0

    pastData.push({
      semesterId: sem.id,
      gpa: parseFloat(gpa.toFixed(2)),
      totalCredits: totalCr,
      courses: semCourses,
    })
  }

  // ── CGPA: weighted average over all published results ─────────────────────
  // previousCgpa excludes current semester — used for the "vs. last semester" delta.

  interface CgpaEntry { credits: number; gradePoint: number; isCurrent: boolean }
  const cgpaEntries: CgpaEntry[] = []

  for (const e of pastEnrollments) {
    const r = e.result
    if (!r?.isPublished) continue
    cgpaEntries.push({
      credits: Number(e.courseSection.course.credits),
      gradePoint: gradeToPoint(r.grade),
      isCurrent: false,
    })
  }
  for (const e of currentEnrollments) {
    const r = e.result
    if (!r?.isPublished) continue
    cgpaEntries.push({
      credits: Number(e.courseSection.course.credits),
      gradePoint: gradeToPoint(r.grade),
      isCurrent: true,
    })
  }

  const sumAll = cgpaEntries.reduce(
    (acc, e) => ({ pts: acc.pts + e.gradePoint * e.credits, cr: acc.cr + e.credits }),
    { pts: 0, cr: 0 },
  )
  const sumPrev = cgpaEntries
    .filter((e) => !e.isCurrent)
    .reduce(
      (acc, e) => ({ pts: acc.pts + e.gradePoint * e.credits, cr: acc.cr + e.credits }),
      { pts: 0, cr: 0 },
    )

  const cgpa = sumAll.cr > 0 ? parseFloat((sumAll.pts / sumAll.cr).toFixed(2)) : 0
  const previousCgpa = sumPrev.cr > 0 ? parseFloat((sumPrev.pts / sumPrev.cr).toFixed(2)) : 0

  // ── Map semester list ──────────────────────────────────────────────────────

  const semesters: Semester[] = dbSemesters.map((s) => ({
    id: s.id,
    programmeId: s.programmeId,
    name: s.name,
    academicYear: s.academicYear,
    semesterNumber: s.semesterNumber,
    startDate: toISODate(s.startDate),
    endDate: toISODate(s.endDate),
    isCurrent: s.isCurrent,
  }))

  return {
    studentNumber: student.studentNumber,
    programme: {
      code: programme.code,
      name: programme.name,
      totalCredits: programme.totalCredits,
    },
    enrollment: {
      expectedGradDate: toISODate(enrollment.expectedGradDate),
      status: enrollment.status.toLowerCase(),
    },
    cgpa,
    previousCgpa,
    totalCreditsEnrolled,
    semesters,
    currentData: { courses, sections, results, lecturerNames },
    pastData,
  }
}
