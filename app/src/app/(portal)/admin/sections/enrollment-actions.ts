'use server'

// Admin management of section rosters (StudentSectionEnrollment).
//   loadSectionEnrollment  — admin-guarded read for the "Manage students" modal (initial + refresh).
//   adminEnrollStudent     — $transaction: eligibility (same programme) + capacity check → upsert ENROLLED.
//   adminDropStudent       — flip an existing ENROLLED row to DROPPED (soft remove; preserves history).
//
// Mirrors approveAddDropRequest (admin/requests/actions.ts): capacity check inside the
// transaction, upsert to ENROLLED (re-enrolls a previously DROPPED row), status flip to DROPPED.
// IDs validated with the lenient sectionIdSchema/studentIdSchema (Zod v4 strict uuid() rejects
// deterministic seed IDs).

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getValidatedSession } from '@/lib/session-guard'
import { sectionIdSchema, studentIdSchema } from '@/lib/schemas'
import { getSectionEnrollmentData } from '@/services/section-enrollment-queries'
import type { SectionEnrollmentData } from '@/types/admin-enrollment'

type ActionState = { error?: string; success?: boolean }

// Friendly-message error used to abort an interactive $transaction with a known cause.
class EnrollmentError extends Error {}

async function assertAdmin() {
  const session = await getValidatedSession()
  if (session.user.role !== 'admin') redirect('/login')
  return session
}

function revalidateEnrollmentSurfaces() {
  revalidatePath('/admin/sections')
  revalidatePath('/admin')
  revalidatePath('/timetable')
  revalidatePath('/classes')
}

// ─── Read (modal load + post-mutation refresh) ───────────────────────────────

export async function loadSectionEnrollment(
  sectionId: string,
): Promise<{ data: SectionEnrollmentData } | { error: string }> {
  await assertAdmin()
  const parsed = sectionIdSchema.safeParse(sectionId)
  if (!parsed.success) return { error: 'Invalid section ID' }

  const data = await getSectionEnrollmentData(parsed.data)
  if (!data) return { error: 'Section not found' }
  return { data }
}

// ─── Add ─────────────────────────────────────────────────────────────────────

export async function adminEnrollStudent(
  sectionId: string,
  studentId: string,
): Promise<ActionState> {
  await assertAdmin()
  const parsedSection = sectionIdSchema.safeParse(sectionId)
  if (!parsedSection.success) return { error: 'Invalid section ID' }
  const parsedStudent = studentIdSchema.safeParse(studentId)
  if (!parsedStudent.success) return { error: 'Invalid student ID' }

  try {
    await prisma.$transaction(async (tx) => {
      const section = await tx.courseSection.findUnique({
        where: { id: parsedSection.data },
        select: {
          isActive: true,
          maxCapacity: true,
          semester: { select: { programmeId: true } },
        },
      })
      if (!section) throw new EnrollmentError('Section not found.')
      if (!section.isActive) throw new EnrollmentError('Cannot enrol into an inactive section.')

      // Eligibility: the student must have an ACTIVE programme enrollment for the
      // section's programme (same-programme rule).
      const eligible = await tx.programmeEnrollment.findFirst({
        where: {
          studentId: parsedStudent.data,
          programmeId: section.semester.programmeId,
          status: 'ACTIVE',
        },
        select: { id: true },
      })
      if (!eligible) {
        throw new EnrollmentError('Student is not in this section’s programme.')
      }

      // Capacity check inside the transaction. A re-enrol of a DROPPED student is not
      // yet counted as ENROLLED, so the count never double-counts them.
      const enrolledCount = await tx.studentSectionEnrollment.count({
        where: { courseSectionId: parsedSection.data, status: 'ENROLLED' },
      })
      if (enrolledCount >= section.maxCapacity) {
        throw new EnrollmentError('Section is at full capacity.')
      }

      await tx.studentSectionEnrollment.upsert({
        where: {
          studentId_courseSectionId: {
            studentId: parsedStudent.data,
            courseSectionId: parsedSection.data,
          },
        },
        create: {
          studentId: parsedStudent.data,
          courseSectionId: parsedSection.data,
          status: 'ENROLLED',
        },
        update: { status: 'ENROLLED' },
      })
    })
  } catch (err) {
    if (err instanceof EnrollmentError) return { error: err.message }
    throw err
  }

  revalidateEnrollmentSurfaces()
  return { success: true }
}

// ─── Remove (soft drop) ──────────────────────────────────────────────────────

export async function adminDropStudent(
  sectionId: string,
  studentId: string,
): Promise<ActionState> {
  await assertAdmin()
  const parsedSection = sectionIdSchema.safeParse(sectionId)
  if (!parsedSection.success) return { error: 'Invalid section ID' }
  const parsedStudent = studentIdSchema.safeParse(studentId)
  if (!parsedStudent.success) return { error: 'Invalid student ID' }

  const existing = await prisma.studentSectionEnrollment.findUnique({
    where: {
      studentId_courseSectionId: {
        studentId: parsedStudent.data,
        courseSectionId: parsedSection.data,
      },
    },
    select: { id: true, status: true },
  })
  if (!existing || existing.status !== 'ENROLLED') {
    return { error: 'No active enrolment found to remove.' }
  }

  await prisma.studentSectionEnrollment.update({
    where: { id: existing.id },
    data: { status: 'DROPPED' },
  })

  revalidateEnrollmentSurfaces()
  return { success: true }
}
