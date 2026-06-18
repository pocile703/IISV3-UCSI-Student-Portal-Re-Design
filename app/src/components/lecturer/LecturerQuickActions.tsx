import Link from 'next/link'
import { ClipboardList, BookOpen, Calendar, UserCircle } from 'lucide-react'

const ACTIONS = [
  { label: 'Attendance',  icon: ClipboardList, href: '/lecturer/attendance' },
  { label: 'My Classes',  icon: BookOpen,      href: '/lecturer/resources' },
  { label: 'Timetable',   icon: Calendar,      href: '/lecturer/timetable' },
  { label: 'Profile',     icon: UserCircle,    href: '/lecturer/profile' },
] as const

export function LecturerQuickActions() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {ACTIONS.map(({ label, href, icon: Icon }) => (
        <Link
          key={href + label}
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
