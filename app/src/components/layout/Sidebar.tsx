'use client'

import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Role } from '@/types/user'
import { useLayoutContext } from '@/contexts/LayoutContext'
import { SidebarNav } from './SidebarNav'

interface SidebarProps {
  role: Role
}

export function Sidebar({ role }: SidebarProps) {
  const { sidebarCollapsed, toggleSidebar } = useLayoutContext()

  return (
    <aside
      style={{ width: sidebarCollapsed ? '64px' : '240px', backgroundColor: 'var(--sidebar-bg, #1e293b)' }}
      className={cn(
        'relative hidden md:flex flex-col shrink-0',
        'border-r border-[--sidebar-nav-border]',
        'transition-[width] duration-200 ease-in-out',
        'overflow-hidden h-full',
      )}
      aria-label="Sidebar"
    >
      <SidebarNav role={role} collapsed={sidebarCollapsed} />

      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={cn(
          'flex shrink-0 items-center justify-center',
          'h-8 w-8 rounded-lg mx-auto mb-3',
          'text-zinc-300 hover:bg-white/10 hover:text-zinc-100',
          'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]',
        )}
      >
        <ChevronLeft
          size={16}
          aria-hidden="true"
          className={cn(
            'transition-transform duration-200',
            sidebarCollapsed && 'rotate-180',
          )}
        />
      </button>
    </aside>
  )
}
