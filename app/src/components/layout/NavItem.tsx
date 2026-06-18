'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { NavItemConfig } from '@/lib/nav'

interface NavItemProps extends NavItemConfig {
  collapsed?: boolean
}

export function NavItem({ href, label, icon: Icon, matchExact, collapsed = false }: NavItemProps) {
  const pathname = usePathname()
  const isActive = matchExact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        'flex items-center rounded-lg text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]',
        collapsed
          ? 'justify-center px-2 py-2'
          : isActive
            ? 'gap-3 pl-[10px] pr-3 py-2 border-l-2 border-[var(--ucsi-red,#C1272D)]'
            : 'gap-3 px-3 py-2',
        isActive
          ? 'bg-white/20 text-white'
          : 'text-zinc-300 hover:bg-white/10 hover:text-zinc-100',
      )}
    >
      <Icon size={20} aria-hidden="true" className="shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  )
}
