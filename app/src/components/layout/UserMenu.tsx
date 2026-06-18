'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, LogOut, User } from 'lucide-react'
import { signOut } from 'next-auth/react'
import type { Role } from '@/types/user'

const ROLE_LABELS: Record<Role, string> = {
  student: 'Student',
  lecturer: 'Lecturer',
  admin: 'Admin',
}

const PROFILE_HREF: Record<Role, string> = {
  student:  '/profile',
  lecturer: '/lecturer/profile',
  admin:    '/admin/profile',
}

interface UserMenuProps {
  role: Role
  userName: string
}

export function UserMenu({ role, userName }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

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

  return (
    <div className="relative" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="User menu"
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: 'var(--ucsi-red)' }}>
          {userName.charAt(0).toUpperCase()}
        </span>
        <span className="hidden flex-col items-start md:flex">
          <span className="text-xs font-semibold text-[--text-primary] leading-tight">
            {userName}
          </span>
          <span className="text-[10px] text-[--text-secondary] leading-tight">
            {ROLE_LABELS[role]}
          </span>
        </span>
        <ChevronDown size={14} aria-hidden="true" className="text-[--text-muted]" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="User menu"
          className="absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border border-[--ucsi-border] py-1 shadow-xl"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <Link
            href={PROFILE_HREF[role]}
            onClick={() => setOpen(false)}
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[--text-secondary] hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-[--text-primary]"
          >
            <User size={14} aria-hidden="true" />
            Profile
          </Link>
          <div className="my-1 border-t border-[--ucsi-border]" />
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut size={14} aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
