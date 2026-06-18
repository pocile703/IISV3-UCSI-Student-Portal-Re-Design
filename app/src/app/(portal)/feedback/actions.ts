'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getValidatedSession } from '@/lib/session-guard'
import { z } from 'zod'

const feedbackSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(255, 'Subject is too long'),
  body: z.string().min(1, 'Details are required').max(5000, 'Details must be 5,000 characters or fewer'),  // S6
})

export type FeedbackFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string }

export async function submitFeedback(
  _prev: FeedbackFormState,
  formData: FormData,
): Promise<FeedbackFormState> {
  const session = await getValidatedSession()
  const studentId = session.user?.studentId
  // M5: explicit role check; S5: redirect on missing session; isActive+sessionVersion via getValidatedSession
  if (!studentId || session.user.role !== 'student') redirect('/login')

  const parsed = feedbackSchema.safeParse({
    subject: formData.get('subject'),
    body: formData.get('body'),
  })
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  await prisma.feedback.create({
    data: {
      studentId,
      subject: parsed.data.subject,
      body: parsed.data.body,
    },
  })

  return { status: 'success' }
}
