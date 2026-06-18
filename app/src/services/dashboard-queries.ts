// Server-only Prisma queries for the student Dashboard page.
import { prisma } from '@/lib/prisma'
import { GRADE_POINTS, toTime } from '@/lib/query-helpers'
import { PaymentStatus, SectionEnrollmentStatus } from '@prisma/client'
import type { DashboardPageData, DashboardScheduleItem } from '@/types/dashboard'

export async function getDashboardData(studentId: string): Promise<DashboardPageData> {
  // ── Round-trip 1: 3 independent queries in parallel ───────────────────────
  const [studentRow, allEnrollments, invoiceRows] = await Promise.all([
    // Q1 — student basic info + current-semester schedule
    prisma.student.findUniqueOrThrow({
      where: { id: studentId },
      select: {
        userId: true,
        studentNumber: true,
        fullName: true,
        sectionEnrollments: {
          where: {
            status: SectionEnrollmentStatus.ENROLLED,
            courseSection: { semester: { isCurrent: true } },
          },
          select: {
            courseSection: {
              select: {
                id: true,
                dayOfWeek: true,
                timeStart: true,
                timeEnd: true,
                room: true,
                course: {
                  select: { code: true, title: true, credits: true },
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
        },
      },
    }),

    // Q2 — all-time enrollments for CGPA (every semester, not just current)
    prisma.studentSectionEnrollment.findMany({
      where: { studentId },
      select: {
        courseSection: {
          select: { course: { select: { credits: true } } },
        },
        result: {
          select: { grade: true, isPublished: true },
        },
      },
    }),

    // Q3 — invoices + payments for balance due
    prisma.invoice.findMany({
      where: { studentId },
      select: {
        tuitionFee: true,
        lessAmount: true,
        payments: {
          where: { status: PaymentStatus.COMPLETED },
          select: { amount: true },
        },
      },
    }),
  ])

  // ── Derive sectionIds + userId from Q1 for round-trip 2 ──────────────────
  const currentEnrollments = studentRow.sectionEnrollments
  const sectionIds = currentEnrollments.map((e) => e.courseSection.id)
  const { userId } = studentRow

  // ── Round-trip 2: 2 queries that depend on Q1 output ─────────────────────
  // notification.count has a .catch fallback — display-only metadata must not
  // break the dashboard if it fails.
  const notificationCountPromise = prisma.notification
    .count({ where: { userId, isRead: false } })
    .catch(() => 0)

  const [announcementRows, unreadNotifications] = await Promise.all([
    // Q4 — global admin posts + section-scoped posts for enrolled sections
    prisma.classPost.findMany({
      where: {
        isPublished: true,
        OR: [
          { courseSectionId: null },
          { courseSectionId: { in: sectionIds } },
        ],
      },
      select: {
        id: true,
        title: true,
        body: true,
        courseSectionId: true,
        courseSection: { select: { sectionCode: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),

    // Q5 — unread count; uses userId from Q1, hits the covering index
    notificationCountPromise,
  ])

  // ── Build sorted schedule items ───────────────────────────────────────────
  const sections: DashboardScheduleItem[] = currentEnrollments
    .map((e) => {
      const cs = e.courseSection
      const ta = cs.teachingAssignments[0]
      return {
        id: cs.id,
        courseCode: cs.course.code,
        courseTitle: cs.course.title,
        room: cs.room ?? '—',
        dayOfWeek: cs.dayOfWeek + 1, // DB: 0=Mon → UI: 1=Mon
        timeStart: toTime(cs.timeStart),
        timeEnd: toTime(cs.timeEnd),
        lecturerName: ta?.lecturer?.fullName ?? undefined,
        credits: Number(cs.course.credits),
      }
    })
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.timeStart.localeCompare(b.timeStart))

  // ── CGPA: all-time weighted average of published results ──────────────────
  let weightedSum = 0
  let totalCreditsGraded = 0
  for (const sse of allEnrollments) {
    if (!sse.result || !sse.result.isPublished) continue
    const gp = GRADE_POINTS[sse.result.grade]
    if (gp === undefined) continue // empty-string grade (unpublished stored as '') or unknown
    const credits = Number(sse.courseSection.course.credits)
    weightedSum += gp * credits
    totalCreditsGraded += credits
  }
  const cgpa = totalCreditsGraded > 0 ? weightedSum / totalCreditsGraded : 0

  // ── Balance due: COMPLETED payments only, clamped ≥ 0 (finance invariant) ─
  let balanceDue = 0
  for (const inv of invoiceRows) {
    const completedPaid = inv.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    )
    balanceDue += Math.max(0, Number(inv.tuitionFee) - Number(inv.lessAmount) - completedPaid)
  }

  // ── Semester name from first enrolled section ─────────────────────────────
  const semesterName = currentEnrollments[0]?.courseSection.semester.name ?? ''

  return {
    firstName: studentRow.fullName.split(' ')[0],
    studentNumber: studentRow.studentNumber,
    semesterName,
    cgpa,
    enrolledCredits: sections.reduce((sum, s) => sum + s.credits, 0),
    subjectCount: sections.length,
    balanceDue,
    unreadNotifications,
    sections,
    announcements: announcementRows.map((p) => ({
      id: p.id,
      title: p.title,
      body: p.body,
      courseSectionId: p.courseSectionId,
      sectionCode: p.courseSection?.sectionCode ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
  }
}
