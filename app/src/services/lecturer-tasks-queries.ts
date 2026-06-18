import { prisma } from '@/lib/prisma'
import type { LecturerTask } from '@/types/lecturer-task'

export async function getLecturerTasks(lecturerId: string): Promise<LecturerTask[]> {
  const rows = await prisma.task.findMany({
    where: { lecturerId },
    select: { id: true, text: true, context: true, dueDate: true, isDone: true },
    // Done tasks sink to the bottom; within each group sort by due date then creation order.
    orderBy: [{ isDone: 'asc' }, { dueDate: 'asc' }, { createdAt: 'asc' }],
  })
  return rows.map((r) => ({
    id: r.id,
    text: r.text,
    context: r.context,
    dueDate: r.dueDate ? (r.dueDate as Date).toISOString().split('T')[0] : null,
    isDone: r.isDone,
  }))
}
