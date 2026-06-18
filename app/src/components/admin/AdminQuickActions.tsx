import Link from 'next/link'
import { Users, LayoutGrid, BookOpen, FileText } from 'lucide-react'

const ACTIONS = [
  { label: 'Manage Users',      icon: Users,      href: '/admin/users' },
  { label: 'Manage Sections',   icon: LayoutGrid, href: '/admin/sections' },
  { label: 'Manage Programmes', icon: BookOpen,   href: '/admin/programmes' },
  { label: 'View Resources',    icon: FileText,   href: '/admin/resources' },
] as const

export function AdminQuickActions() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {ACTIONS.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-2.5 rounded-lg border border-[--ucsi-border] bg-white px-3.5 py-3 text-sm font-medium text-[--text-secondary] shadow-sm transition-colors hover:border-[#C1272D] hover:bg-[--ucsi-red]/15 hover:text-[#C1272D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red] dark:bg-zinc-800"
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            <Icon size={16} aria-hidden="true" />
          </span>
          {label}
        </Link>
      ))}
    </div>
  )
}
