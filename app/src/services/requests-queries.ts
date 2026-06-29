// Server-only Prisma queries for the Add/Drop + Progression request surfaces.
//   getStudentRequestsData(studentId) — a student's own requests + the option
//     lists their forms need (addable/droppable sections, progression targets).
//   getAdminRequestsData() — every request, with the requesting student's identity,
//     for the admin moderation queue.
import { prisma } from '@/lib/prisma'
import type {
  StudentRequestsData,
  AdminRequestsData,
  RequestStatus,
  AddDropAction,
} from '@/types/requests'

type SectionShape = {
  sectionCode: string
  course: { code: string; title: string }
}

function sectionLabel(s: SectionShape): string {
  return `${s.course.code} ${s.course.title} · Sec ${s.sectionCode}`
}

// Resolves the student's programme: prefer the ACTIVE enrollment, fall back to
// the most recent one (DEFERRED/WITHDRAWN students still see their history).
async function resolveProgrammeId(studentId: string): Promise<string | null> {
  const active = await prisma.programmeEnrollment.findFirst({
    where: { studentId, status: 'ACTIVE' },
    orderBy: { intakeDate: 'desc' },
    select: { programmeId: true },
  })
  if (active) return active.programmeId
  const latest = await prisma.programmeEnrollment.findFirst({
    where: { studentId },
    orderBy: { intakeDate: 'desc' },
    select: { programmeId: true },
  })
  return latest?.programmeId ?? null
}

export async function getStudentRequestsData(studentId: string): Promise<StudentRequestsData> {
  const programmeId = await resolveProgrammeId(studentId)

  const currentSemester = programmeId
    ? await prisma.semester.findFirst({
        where: { programmeId, isCurrent: true },
        select: { id: true, name: true },
      })
    : null

  const [semesters, enrolled, allSections, addDrop, progression] = await Promise.all([
    programmeId
      ? prisma.semester.findMany({
          where: { programmeId },
          orderBy: [{ academicYear: 'asc' }, { semesterNumber: 'asc' }],
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    currentSemester
      ? prisma.studentSectionEnrollment.findMany({
          where: {
            studentId,
            status: 'ENROLLED',
            courseSection: { semesterId: currentSemester.id },
          },
          select: {
            courseSection: {
              select: { id: true, sectionCode: true, course: { select: { code: true, title: true } } },
            },
          },
        })
      : Promise.resolve([]),
    currentSemester
      ? prisma.courseSection.findMany({
          where: { semesterId: currentSemester.id, isActive: true },
          select: { id: true, sectionCode: true, course: { select: { code: true, title: true } } },
        })
      : Promise.resolve([]),
    prisma.addDropRequest.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        status: true,
        reason: true,
        createdAt: true,
        reviewedAt: true,
        courseSection: {
          select: { sectionCode: true, course: { select: { code: true, title: true } } },
        },
      },
    }),
    prisma.progressionRequest.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        reason: true,
        createdAt: true,
        reviewedAt: true,
        fromSemester: { select: { name: true } },
        toSemester: { select: { name: true } },
      },
    }),
  ])

  const enrolledIds = new Set(enrolled.map((e) => e.courseSection.id))

  return {
    requests: {
      addDrop: addDrop.map((r) => ({
        id: r.id,
        action: r.action.toLowerCase() as AddDropAction,
        status: r.status.toLowerCase() as RequestStatus,
        sectionLabel: sectionLabel(r.courseSection),
        reason: r.reason,
        createdAt: r.createdAt.toISOString(),
        reviewedAt: r.reviewedAt?.toISOString() ?? null,
      })),
      progression: progression.map((r) => ({
        id: r.id,
        status: r.status.toLowerCase() as RequestStatus,
        fromSemester: r.fromSemester.name,
        toSemester: r.toSemester.name,
        reason: r.reason,
        createdAt: r.createdAt.toISOString(),
        reviewedAt: r.reviewedAt?.toISOString() ?? null,
      })),
    },
    options: {
      currentSemesterId: currentSemester?.id ?? null,
      currentSemesterName: currentSemester?.name ?? null,
      addableSections: allSections
        .filter((s) => !enrolledIds.has(s.id))
        .map((s) => ({ id: s.id, label: sectionLabel(s) })),
      droppableSections: enrolled.map((e) => ({
        id: e.courseSection.id,
        label: sectionLabel(e.courseSection),
      })),
      progressionTargets: semesters
        .filter((s) => s.id !== currentSemester?.id)
        .map((s) => ({ id: s.id, name: s.name })),
    },
  }
}

export async function getAdminRequestsData(): Promise<AdminRequestsData> {
  const [addDrop, progression] = await Promise.all([
    prisma.addDropRequest.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        status: true,
        reason: true,
        createdAt: true,
        reviewedAt: true,
        student: { select: { fullName: true, studentNumber: true } },
        courseSection: {
          select: { sectionCode: true, course: { select: { code: true, title: true } } },
        },
      },
    }),
    prisma.progressionRequest.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        reason: true,
        createdAt: true,
        reviewedAt: true,
        student: { select: { fullName: true, studentNumber: true } },
        fromSemester: { select: { name: true } },
        toSemester: { select: { name: true } },
      },
    }),
  ])

  return {
    addDrop: addDrop.map((r) => ({
      id: r.id,
      action: r.action.toLowerCase() as AddDropAction,
      status: r.status.toLowerCase() as RequestStatus,
      sectionLabel: sectionLabel(r.courseSection),
      reason: r.reason,
      createdAt: r.createdAt.toISOString(),
      reviewedAt: r.reviewedAt?.toISOString() ?? null,
      studentName: r.student.fullName,
      studentNumber: r.student.studentNumber,
    })),
    progression: progression.map((r) => ({
      id: r.id,
      status: r.status.toLowerCase() as RequestStatus,
      fromSemester: r.fromSemester.name,
      toSemester: r.toSemester.name,
      reason: r.reason,
      createdAt: r.createdAt.toISOString(),
      reviewedAt: r.reviewedAt?.toISOString() ?? null,
      studentName: r.student.fullName,
      studentNumber: r.student.studentNumber,
    })),
  }
}
