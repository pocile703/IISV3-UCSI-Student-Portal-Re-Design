// Server-only Prisma queries for the student Feedback (/feedback) page.
import { prisma } from '@/lib/prisma'
import type { Feedback, FeedbackStatus } from '@/types/feedback'

type FeedbackRow = Omit<Feedback, 'studentId'>

export async function getFeedbackData(studentId: string): Promise<FeedbackRow[]> {
  const rows = await prisma.feedback.findMany({
    where: { studentId },
    select: {
      id:         true,
      subject:    true,
      body:       true,
      status:     true,
      createdAt:  true,
      resolvedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return rows.map((r) => ({
    id:         r.id,
    subject:    r.subject,
    body:       r.body,
    status:     r.status.toLowerCase() as FeedbackStatus,
    createdAt:  r.createdAt.toISOString(),
    resolvedAt: r.resolvedAt?.toISOString(),
  }))
}
