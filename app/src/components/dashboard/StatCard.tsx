import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  icon: LucideIcon
  accent?: boolean
  className?: string
}

export function StatCard({ label, value, sub, icon: Icon, accent = false, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-[--ucsi-border] p-4 shadow-sm sm:gap-4 sm:p-5',
        className,
      )}
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          accent ? 'text-[--ucsi-red]' : 'text-[--text-secondary]',
        )}
        style={{ backgroundColor: 'var(--bg-elevated)' }}
      >
        <Icon size={20} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-[--text-secondary]">{label}</p>
        <p className="mt-0.5 text-lg font-semibold text-[--text-primary] sm:text-xl">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-[--text-secondary]">{sub}</p>}
      </div>
    </div>
  )
}
