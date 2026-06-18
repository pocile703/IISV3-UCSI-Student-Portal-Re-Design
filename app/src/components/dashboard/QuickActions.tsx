import Link from 'next/link'
import { GraduationCap, CreditCard, Calendar, MessageSquare } from 'lucide-react'

const ACTIONS = [
  { label: 'View Results',      href: '/academic',  icon: GraduationCap },
  { label: 'Pay Fees',          href: '/finance',   icon: CreditCard },
  { label: 'Timetable',         href: '/timetable', icon: Calendar },
  { label: 'Submit Feedback',   href: '/feedback',  icon: MessageSquare },
]

export function QuickActions() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[--text-secondary]">Quick Access</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ACTIONS.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2 rounded-xl border border-[--ucsi-border] bg-white px-3 py-4 text-center text-xs font-medium text-[--text-secondary] shadow-sm transition-colors hover:border-[#C1272D] hover:text-[#C1272D] dark:bg-zinc-800"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <Icon size={20} aria-hidden="true" />
            </span>
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
