'use server'

// Student-side request submission:
//   submitAddDropRequest      — create a PENDING AddDropRequest (ADD or DROP)
//   submitProgressionRequest  — create a PENDING ProgressionRequest
//
// Both assert role explicitly (M5) via getValidatedSession() + a student-role check.
// courseSectionId / semester IDs are validated against the student's programme and
// current enrollment server-side — the form option lists are convenience only.

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getValidatedSession } from '@/lib/session-guard'
import {
  addDropActionSchema,
  sectionIdSchema,
  semesterIdSchema,
  requestReasonOptionalSchema,
  requestReasonRequiredSchema,
} from '@/lib/schemas'

export type RequestFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string }

async function assertStudent() {
  const session = await getValidatedSession()
  const studentId = session.user?.studentId
  if (!studentId || session.user.role !== 'student') redirect('/login')
  return studentId
}

// ─── Add / Drop ────────────────────────────────────────────────────────────

const addDropSchema = z.object({
  action: addDropActionSchema,
  courseSectionId: sectionIdSchema,
  reason: requestReasonOptionalSchema,
})

export async function submitAddDropRequest(
  _prev: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  const studentId = await assertStudent()

  const parsed = addDropSchema.safeParse({
    action: formData.get('action'),
    courseSectionId: formData.get('courseSectionId'),
    reason: formData.get('reason'),
  })
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }
  const { action, courseSectionId, reason } = parsed.data
  const dbAction = action.toUpperCase() as 'ADD' | 'DROP'

  // Section must exist, be active, and sit in a current semester.
  const section = await prisma.courseSection.findUnique({
    where: { id: courseSectionId },
    select: {
      isActive: true,
      semester: { select: { programmeId: true, isCurrent: true } },
    },
  })
  if (!section || !section.isActive || !section.semester.isCurrent) {
    return { status: 'error', message: 'That class is not available for requests.' }
  }

  // Section must belong to a programme the student is enrolled in.
  const inProgramme = await prisma.programmeEnrollment.findFirst({
    where: { studentId, programmeId: section.semester.programmeId },
    select: { id: true },
  })
  if (!inProgramme) {
    return { status: 'error', message: 'That class is not part of your programme.' }
  }

  // Action must be consistent with the current enrollment state.
  const enrollment = await prisma.studentSectionEnrollment.findUnique({
    where: { studentId_courseSectionId: { studentId, courseSectionId } },
    select: { status: true },
  })
  if (dbAction === 'ADD' && enrollment?.status === 'ENROLLED') {
    return { status: 'error', message: 'You are already enrolled in that class.' }
  }
  if (dbAction === 'DROP' && enrollment?.status !== 'ENROLLED') {
    return { status: 'error', message: 'You are not currently enrolled in that class.' }
  }

  // One pending request per section at a time.
  const pending = await prisma.addDropRequest.findFirst({
    where: { studentId, courseSectionId, status: 'PENDING' },
    select: { id: true },
  })
  if (pending) {
    return { status: 'error', message: 'You already have a pending request for that class.' }
  }

  await prisma.addDropRequest.create({
    data: { studentId, courseSectionId, action: dbAction, reason: reason ?? null },
  })

  revalidatePath('/requests')
  return { status: 'success' }
}

// ─── Progression ─────────────────────────────────────────────────────────────

const progressionSchema = z.object({
  fromSemesterId: semesterIdSchema,
  toSemesterId: semesterIdSchema,
  reason: requestReasonRequiredSchema,
})

export async function submitProgressionRequest(
  _prev: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  const studentId = await assertStudent()

  const parsed = progressionSchema.safeParse({
    fromSemesterId: formData.get('fromSemesterId'),
    toSemesterId: formData.get('toSemesterId'),
    reason: formData.get('reason'),
  })
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }
  const { fromSemesterId, toSemesterId, reason } = parsed.data

  if (fromSemesterId === toSemesterId) {
    return { status: 'error', message: 'The current and target semesters must differ.' }
  }

  // Both semesters must exist and belong to the same programme.
  const semesters = await prisma.semester.findMany({
    where: { id: { in: [fromSemesterId, toSemesterId] } },
    select: { id: true, programmeId: true },
  })
  if (semesters.length !== 2) {
    return { status: 'error', message: 'One or more selected semesters could not be found.' }
  }
  const programmeIds = new Set(semesters.map((s) => s.programmeId))
  if (programmeIds.size !== 1) {
    return { status: 'error', message: 'Both semesters must belong to the same programme.' }
  }
  const programmeId = [...programmeIds][0]

  // The student must be enrolled in that programme.
  const inProgramme = await prisma.programmeEnrollment.findFirst({
    where: { studentId, programmeId },
    select: { id: true },
  })
  if (!inProgramme) {
    return { status: 'error', message: 'Those semesters are not part of your programme.' }
  }

  // One pending progression request at a time.
  const pending = await prisma.progressionRequest.findFirst({
    where: { studentId, status: 'PENDING' },
    select: { id: true },
  })
  if (pending) {
    return { status: 'error', message: 'You already have a pending progression request.' }
  }

  await prisma.progressionRequest.create({
    data: { studentId, fromSemesterId, toSemesterId, reason },
  })

  revalidatePath('/requests')
  return { status: 'success' }
}
