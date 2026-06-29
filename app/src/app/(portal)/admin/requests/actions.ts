'use server'

// Admin moderation of student Add/Drop + Progression requests.
//   approveAddDropRequest  — $transaction: mark APPROVED + apply the enrollment change
//                            (ADD → upsert ENROLLED with maxCapacity check; DROP → DROPPED).
//   rejectAddDropRequest   — mark REJECTED (no enrollment side effect).
//   approve/rejectProgressionRequest — status-only (progression is recorded, not auto-applied
//                            to enrollment for assignment scope; see note below).
//
// All actions assert admin role (assertAdmin) and validate the request ID with the
// lenient requestIdSchema (Zod v4 strict uuid() rejects deterministic seed IDs).

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getValidatedSession } from '@/lib/session-guard'
import { requestIdSchema } from '@/lib/schemas'

type ActionState = { error?: string; success?: boolean }

// Friendly-message error used to abort an interactive $transaction with a known cause.
class RequestError extends Error {}

async function assertAdmin() {
  const session = await getValidatedSession()
  if (session.user.role !== 'admin') redirect('/login')
  return session
}

function revalidateRequestSurfaces() {
  revalidatePath('/admin/requests')
  revalidatePath('/admin')
  revalidatePath('/requests')
}

// ─── Add / Drop ────────────────────────────────────────────────────────────

export async function approveAddDropRequest(requestId: string): Promise<ActionState> {
  const session = await assertAdmin()
  const parsedId = requestIdSchema.safeParse(requestId)
  if (!parsedId.success) return { error: 'Invalid request ID' }
  const reviewerId = session.user.id

  try {
    await prisma.$transaction(async (tx) => {
      const req = await tx.addDropRequest.findUnique({
        where: { id: parsedId.data },
        select: {
          id: true,
          status: true,
          action: true,
          studentId: true,
          courseSectionId: true,
          courseSection: { select: { maxCapacity: true } },
        },
      })
      if (!req) throw new RequestError('Request not found.')
      if (req.status !== 'PENDING') throw new RequestError('Request has already been decided.')

      if (req.action === 'ADD') {
        // Capacity check inside the transaction. The requesting student is not yet
        // ENROLLED, so the count never includes them.
        const enrolledCount = await tx.studentSectionEnrollment.count({
          where: { courseSectionId: req.courseSectionId, status: 'ENROLLED' },
        })
        if (enrolledCount >= req.courseSection.maxCapacity) {
          throw new RequestError('Section is at full capacity.')
        }
        await tx.studentSectionEnrollment.upsert({
          where: {
            studentId_courseSectionId: {
              studentId: req.studentId,
              courseSectionId: req.courseSectionId,
            },
          },
          create: {
            studentId: req.studentId,
            courseSectionId: req.courseSectionId,
            status: 'ENROLLED',
          },
          update: { status: 'ENROLLED' },
        })
      } else {
        // DROP — must already have an enrollment row to flip to DROPPED.
        const existing = await tx.studentSectionEnrollment.findUnique({
          where: {
            studentId_courseSectionId: {
              studentId: req.studentId,
              courseSectionId: req.courseSectionId,
            },
          },
          select: { id: true },
        })
        if (!existing) throw new RequestError('No enrollment found to drop.')
        await tx.studentSectionEnrollment.update({
          where: { id: existing.id },
          data: { status: 'DROPPED' },
        })
      }

      await tx.addDropRequest.update({
        where: { id: req.id },
        data: { status: 'APPROVED', reviewedBy: reviewerId, reviewedAt: new Date() },
      })
    })
  } catch (err) {
    if (err instanceof RequestError) return { error: err.message }
    throw err
  }

  revalidateRequestSurfaces()
  revalidatePath('/timetable')
  revalidatePath('/classes')
  return { success: true }
}

export async function rejectAddDropRequest(requestId: string): Promise<ActionState> {
  const session = await assertAdmin()
  const parsedId = requestIdSchema.safeParse(requestId)
  if (!parsedId.success) return { error: 'Invalid request ID' }

  const res = await prisma.addDropRequest.updateMany({
    where: { id: parsedId.data, status: 'PENDING' },
    data: { status: 'REJECTED', reviewedBy: session.user.id, reviewedAt: new Date() },
  })
  if (res.count === 0) return { error: 'Request not found or already decided.' }

  revalidateRequestSurfaces()
  return { success: true }
}

// ─── Progression ─────────────────────────────────────────────────────────────
// Status-only: approving records the decision but does not auto-migrate the student's
// programme enrollment / current semester (that is a Registrar back-office step outside
// assignment scope). The audit trail (reviewedBy/reviewedAt) is preserved.

export async function approveProgressionRequest(requestId: string): Promise<ActionState> {
  return decideProgressionRequest(requestId, 'APPROVED')
}

export async function rejectProgressionRequest(requestId: string): Promise<ActionState> {
  return decideProgressionRequest(requestId, 'REJECTED')
}

async function decideProgressionRequest(
  requestId: string,
  decision: 'APPROVED' | 'REJECTED',
): Promise<ActionState> {
  const session = await assertAdmin()
  const parsedId = requestIdSchema.safeParse(requestId)
  if (!parsedId.success) return { error: 'Invalid request ID' }

  const res = await prisma.progressionRequest.updateMany({
    where: { id: parsedId.data, status: 'PENDING' },
    data: { status: decision, reviewedBy: session.user.id, reviewedAt: new Date() },
  })
  if (res.count === 0) return { error: 'Request not found or already decided.' }

  revalidateRequestSurfaces()
  return { success: true }
}
