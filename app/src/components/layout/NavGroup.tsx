import type { ReactNode } from 'react'

interface NavGroupProps {
  label: string
  collapsed?: boolean
  children: ReactNode
}

export function NavGroup({ label, collapsed = false, children }: NavGroupProps) {
  return (
    <div className="flex flex-col gap-1">
      {!collapsed && (
        <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          {label}
        </p>
      )}
      {children}
    </div>
  )
}
