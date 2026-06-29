'use client'

import Image from 'next/image'
import { Menu } from 'lucide-react'
import type { Role } from '@/types/user'
import type { NotificationsData } from '@/types/notification'
import { useLayoutContext } from '@/contexts/LayoutContext'
import { NotificationBell } from './NotificationBell'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'

const PORTAL_LABEL: Record<Role, string> = {
  student: 'Student Portal',
  lecturer: 'Lecturer Portal',
  admin: 'Admin Portal',
}

interface TopBarProps {
  role: Role
  userName: string
  notifications: NotificationsData
}

export function TopBar({ role, userName, notifications }: TopBarProps) {
  const { mobileOpen, setMobileOpen } = useLayoutContext()

  return (
    <header className="flex h-14 w-full shrink-0 items-center gap-3 border-b border-[--ucsi-border] px-4" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={mobileOpen}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[--text-secondary] transition-colors hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-[--text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red] md:hidden"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      <div className="flex items-center gap-2.5">
        <div className="rounded px-1 py-0.5 dark:bg-white">
          <Image
            src="/college-logo.png"
            alt="UCSI College"
            width={96}
            height={28}
            className="h-7 w-auto object-contain"
            priority
          />
        </div>
        <span className="hidden text-sm font-semibold text-[--text-primary] sm:block">
          {PORTAL_LABEL[role]}
        </span>
      </div>

      <div className="flex-1" />

      <ThemeToggle />
      <NotificationBell
        initialItems={notifications.items}
        initialUnread={notifications.unreadCount}
      />
      <UserMenu role={role} userName={userName} />
    </header>
  )
}
