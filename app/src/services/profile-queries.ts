// Server-only Prisma queries for the student Profile (/profile) page.
import { prisma } from '@/lib/prisma'
import { toISODate } from '@/lib/query-helpers'
import { Prisma, ProgrammeEnrollmentStatus } from '@prisma/client'
import { redirect } from 'next/navigation'
import type { ProfilePageData, ProfileEnrollment, ProfileEnrollmentStatus } from '@/types/profile'

// Shared select shape for both findFirst calls (active-first fallback pattern).
const ENROLLMENT_SELECT = {
  fileNumber: true,
  intakeDate: true,
  expectedGradDate: true,
  status: true,
  programme: {
    select: { name: true, code: true },
  },
} as const

export async function getProfileData(studentId: string): Promise<ProfilePageData> {
  // P2025 = record not found — missing profile means the session is stale/broken.
  const student = await prisma.student
    .findUniqueOrThrow({
      where: { id: studentId },
      select: {
        studentNumber: true,
        fullName: true,
        dateOfBirth: true,   // @db.Date → Date object
        gender: true,        // Gender enum → lowercase
        nationality: true,
        mobile: true,
        guardianName: true,
        guardianRelation: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postcode: true,
        country: true,
        thecnUsername: true,
        // maritalStatus, avatarUrl, createdAt, updatedAt not rendered on this page.
      },
    })
    .catch((err: unknown) => {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        redirect('/login')
      }
      throw err
    })

  // Prefer the active enrollment when present; otherwise fall back to the most recent record.
  const pe =
    await prisma.programmeEnrollment.findFirst({
      where: { studentId, status: ProgrammeEnrollmentStatus.ACTIVE },
      select: ENROLLMENT_SELECT,
      orderBy: { intakeDate: 'desc' },
    }) ??
    await prisma.programmeEnrollment.findFirst({
      where: { studentId },
      select: ENROLLMENT_SELECT,
      orderBy: { intakeDate: 'desc' },
    })

  const enrollment: ProfileEnrollment | null = pe
    ? {
        fileNumber: pe.fileNumber,
        intakeDate: toISODate(pe.intakeDate),
        expectedGradDate: toISODate(pe.expectedGradDate),
        status: pe.status.toLowerCase() as ProfileEnrollmentStatus,
        programmeName: pe.programme.name,
        programmeCode: pe.programme.code,
      }
    : null

  return {
    fullName: student.fullName,
    studentNumber: student.studentNumber,
    dateOfBirth: toISODate(student.dateOfBirth),
    gender: student.gender.toLowerCase(),
    nationality: student.nationality,
    mobile: student.mobile,
    guardianName: student.guardianName,
    guardianRelation: student.guardianRelation,
    addressLine1: student.addressLine1,
    addressLine2: student.addressLine2 ?? undefined,
    city: student.city,
    state: student.state,
    postcode: student.postcode,
    country: student.country,
    thecnUsername: student.thecnUsername ?? undefined,
    enrollment,
  }
}
