'use client'

import { Bell, CalendarClock, CreditCard, GraduationCap, FileText, Info } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import {
  markNotificationRead,
  markAllNotificationsRead,
} from '@/app/(portal)/notifications/actions'
import type { NotificationItem, NotificationKind } from '@/types/notification'

const TYPE_ICON: Record<NotificationKind, LucideIcon> = {
  attendance_alert: CalendarClock,
  fee_alert: CreditCard,
  grade_published: GraduationCap,
  resource_uploaded: FileText,
  system: Info,
}

export function NotificationBell({
  initialItems,
  initialUnread,
}: {
  initialItems: NotificationItem[]
  initialUnread: number
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Rendered directly from props — the shared portal layout re-fetches and re-feeds
  // these after every router.refresh(), so marking-read updates the list in place.
  const items = initialItems
  const unread = initialUnread

  useEffect(() => {
    if (!open) return
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  function handleMarkOne(id: string, alreadyRead: boolean) {
    if (alreadyRead) return
    startTransition(async () => {
      await markNotificationRead(id)
      router.refresh()
    })
  }

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead()
      router.refresh()
    })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Notifications — ${unread} unread`}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[--text-secondary] transition-colors hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-[--text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]"
      >
        <Bell size={20} aria-hidden="true" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
            style={{ backgroundColor: 'var(--ucsi-red)' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-[--ucsi-border] shadow-xl"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[--ucsi-border] px-3 py-2.5">
            <p className="text-xs font-semibold text-[--text-primary]">
              Notifications{unread > 0 && <span className="ml-1 text-[--text-secondary]">({unread} unread)</span>}
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                disabled={isPending}
                className="text-[11px] font-medium hover:underline disabled:opacity-50"
                style={{ color: 'var(--ucsi-red)' }}
              >
                {isPending ? 'Marking…' : 'Mark all read'}
              </button>
            )}
          </div>

          {/* List */}
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-[--text-muted]">You&apos;re all caught up.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {items.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? Info
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleMarkOne(n.id, n.isRead)}
                      disabled={isPending || n.isRead}
                      className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-zinc-50 disabled:cursor-default dark:hover:bg-white/5"
                    >
                      <span
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: 'var(--bg-elevated)' }}
                      >
                        <Icon size={13} className="text-[--text-secondary]" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className={`truncate text-xs ${n.isRead ? 'font-medium text-[--text-secondary]' : 'font-semibold text-[--text-primary]'}`}>
                            {n.title}
                          </span>
                          {!n.isRead && (
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: 'var(--ucsi-red)' }}
                              aria-label="Unread"
                            />
                          )}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-[11px] text-[--text-secondary]">{n.body}</span>
                        <span className="mt-0.5 block text-[10px] text-[--text-muted]">{formatDate(n.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
