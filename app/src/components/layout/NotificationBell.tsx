'use client'

import { Bell } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const unread = 3

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
        aria-haspopup="dialog"
        aria-label={`Notifications — ${unread} unread`}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[--text-secondary] transition-colors hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-[--text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]"
      >
        <Bell size={20} aria-hidden="true" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
            style={{ backgroundColor: 'var(--ucsi-red)' }}
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-[--ucsi-border] p-3 shadow-xl"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <p className="text-xs font-semibold text-[--text-primary]">Notifications</p>
          <p className="mt-2 text-xs text-[--text-secondary]">Notification list — Phase 3</p>
        </div>
      )}
    </div>
  )
}
