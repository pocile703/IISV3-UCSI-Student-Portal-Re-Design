'use server'

// Notification mutations for the TopBar bell. Notifications are per-User, so the
// only authz needed is "the row belongs to the current session user" (IDOR guard).
//   markNotificationRead(id)     — mark a single notification read
//   markAllNotificationsRead()   — mark every unread notification read
// The client calls router.refresh() after success to re-sync the server-rendered layout.

import { redirect } from 'next/navigation'
import { getValidatedSession } from '@/lib/session-guard'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

type ActionState = { error?: string; success?: boolean }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const notificationIdSchema = z.string().regex(UUID_RE, 'Invalid notification ID')

export async function markNotificationRead(notificationId: string): Promise<ActionState> {
  const session = await getValidatedSession()
  const userId = session.user?.id
  if (!userId) redirect('/login')

  const parsed = notificationIdSchema.safeParse(notificationId)
  if (!parsed.success) return { error: 'Invalid notification ID' }

  // Scope the write to the caller's own rows — updateMany silently no-ops on someone else's.
  await prisma.notification.updateMany({
    where: { id: parsed.data, userId },
    data: { isRead: true },
  })
  return { success: true }
}

export async function markAllNotificationsRead(): Promise<ActionState> {
  const session = await getValidatedSession()
  const userId = session.user?.id
  if (!userId) redirect('/login')

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })
  return { success: true }
}
