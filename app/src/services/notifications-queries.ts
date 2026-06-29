// Server-only Prisma query for the TopBar NotificationBell.
// getNotificationsData(userId) — the user's most recent notifications + unread count.
// Notifications are per-User (all roles), so this works for student/lecturer/admin alike.
import { prisma } from '@/lib/prisma'
import type { NotificationsData, NotificationKind } from '@/types/notification'

const RECENT_LIMIT = 10

export async function getNotificationsData(userId: string): Promise<NotificationsData> {
  const [rows, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: RECENT_LIMIT,
      select: { id: true, title: true, body: true, type: true, isRead: true, createdAt: true },
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ])

  return {
    items: rows.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type.toLowerCase() as NotificationKind,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
  }
}
