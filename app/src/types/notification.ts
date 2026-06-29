// View-model types for the TopBar NotificationBell.
// Mirrors the Notification model, narrowed to what the bell renders; the enum
// type is lowercased to match the frontend union.

export type NotificationKind =
  | 'attendance_alert'
  | 'fee_alert'
  | 'grade_published'
  | 'resource_uploaded'
  | 'system'

export interface NotificationItem {
  id: string
  title: string
  body: string
  type: NotificationKind
  isRead: boolean
  createdAt: string // ISO
}

export interface NotificationsData {
  items: NotificationItem[]
  unreadCount: number
}
