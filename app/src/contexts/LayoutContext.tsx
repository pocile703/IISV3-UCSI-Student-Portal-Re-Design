'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface LayoutState {
  sidebarCollapsed: boolean
  mobileOpen: boolean
  toggleSidebar: () => void
  setMobileOpen: (open: boolean) => void
}

const LayoutContext = createContext<LayoutState | null>(null)

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <LayoutContext.Provider
      value={{
        sidebarCollapsed,
        mobileOpen,
        toggleSidebar: () => setSidebarCollapsed((v) => !v),
        setMobileOpen,
      }}
    >
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayoutContext(): LayoutState {
  const ctx = useContext(LayoutContext)
  if (!ctx) throw new Error('useLayoutContext must be used within LayoutProvider')
  return ctx
}
