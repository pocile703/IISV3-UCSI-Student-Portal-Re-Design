'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { Role } from '@/types/user'
import { useLayoutContext } from '@/contexts/LayoutContext'
import { SidebarNav } from './SidebarNav'

const ANIM_DURATION = 250

interface MobileDrawerProps {
  role: Role
}

export function MobileDrawer({ role }: MobileDrawerProps) {
  const { mobileOpen, setMobileOpen } = useLayoutContext()
  const drawerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (mobileOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVisible(true)
    } else {
      previousFocusRef.current?.focus()
      previousFocusRef.current = null
      const t = setTimeout(() => setIsVisible(false), ANIM_DURATION)
      return () => clearTimeout(t)
    }
  }, [mobileOpen])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    if (mobileOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen, setMobileOpen])

  useEffect(() => {
    if (!mobileOpen || !drawerRef.current) return
    const el = drawerRef.current
    const focusable = el.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])',
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()

    function trapFocus(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', trapFocus)
    return () => document.removeEventListener('keydown', trapFocus)
  }, [mobileOpen])

  if (!isVisible) return null

  return (
    <div className="md:hidden">
      <div
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-40 bg-black/50',
          mobileOpen
            ? 'animate-in fade-in duration-200'
            : 'animate-out fade-out fill-mode-forwards duration-200',
        )}
        onClick={() => setMobileOpen(false)}
      />

      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        style={{ backgroundColor: 'var(--sidebar-bg, #1e293b)' }}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-60 flex-col',
          'border-r border-[--sidebar-nav-border]',
          mobileOpen
            ? 'animate-in slide-in-from-left duration-300'
            : 'animate-out slide-out-to-left fill-mode-forwards duration-300',
        )}
      >
        <SidebarNav role={role} collapsed={false} />
      </div>
    </div>
  )
}
