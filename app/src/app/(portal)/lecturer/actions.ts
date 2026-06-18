'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getValidatedSession } from '@/lib/session-guard'
import { taskIdSchema } from '@/lib/schemas'

export type TaskState = { error?: string; success?: boolean }

// ─── Helpers ────────────────────────────────────────────────────────────────

async function assertLecturer() {
  const session = await getValidatedSession()
  const lecturerId = session.user.lecturerId
  if (!lecturerId || session.user.role !== 'lecturer') redirect('/login')
  return { session, lecturerId }
}

async function assertOwnedTask(taskId: string, lecturerId: string) {
  const parsed = taskIdSchema.safeParse(taskId)
  if (!parsed.success) return { error: 'Invalid task ID' as const }
  const task = await prisma.task.findUnique({
    where: { id: parsed.data },
    select: { lecturerId: true },
  })
  if (!task || task.lecturerId !== lecturerId) return { error: 'Task not found' as const }
  return { taskId: parsed.data }
}

// ─── createTask ──────────────────────────────────────────────────────────────

const createTaskSchema = z.object({
  text: z.string().trim().min(1, 'Task text is required').max(500, 'Max 500 characters'),
  context: z.string().trim().max(200, 'Max 200 characters').optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
})

export async function createTask(
  _prev: TaskState,
  formData: FormData,
): Promise<TaskState> {
  const { lecturerId } = await assertLecturer()

  const parsed = createTaskSchema.safeParse({
    text: formData.get('text'),
    context: formData.get('context') || undefined,
    dueDate: formData.get('dueDate') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const { text, context, dueDate } = parsed.data

  await prisma.task.create({
    data: {
      lecturerId,
      text,
      context: context || null,
      dueDate: dueDate ? new Date(dueDate + 'T00:00:00Z') : null,
    },
  })

  revalidatePath('/lecturer')
  return { success: true }
}

// ─── toggleTask ──────────────────────────────────────────────────────────────

export async function toggleTask(taskId: string): Promise<TaskState> {
  const { lecturerId } = await assertLecturer()

  const check = await assertOwnedTask(taskId, lecturerId)
  if ('error' in check) return { error: check.error }

  // Read current state then flip — avoids a client-supplied boolean in the payload.
  const current = await prisma.task.findUnique({
    where: { id: check.taskId },
    select: { isDone: true },
  })
  if (!current) return { error: 'Task not found' }

  await prisma.task.update({
    where: { id: check.taskId },
    data: { isDone: !current.isDone },
  })

  revalidatePath('/lecturer')
  return { success: true }
}

// ─── deleteTask ──────────────────────────────────────────────────────────────

export async function deleteTask(taskId: string): Promise<TaskState> {
  const { lecturerId } = await assertLecturer()

  const check = await assertOwnedTask(taskId, lecturerId)
  if ('error' in check) return { error: check.error }

  await prisma.task.delete({ where: { id: check.taskId } })

  revalidatePath('/lecturer')
  return { success: true }
}
