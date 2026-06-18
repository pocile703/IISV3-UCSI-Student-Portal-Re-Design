'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'

interface AttendanceDatePanelProps {
  sessionDates: string[]
  markedDates: Set<string>
  selectedDate: string
  onSelectDate: (date: string) => void
  semesterStartDate: string
}

function formatSessionDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-MY', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getWeekNumber(dateStr: string, semesterStartDate: string): number {
  const date = new Date(dateStr + 'T00:00:00')
  const start = new Date(semesterStartDate + 'T00:00:00')
  return Math.floor((date.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
}

export function AttendanceDatePanel({
  sessionDates,
  markedDates,
  selectedDate,
  onSelectDate,
  semesterStartDate,
}: AttendanceDatePanelProps) {
  const today = new Date().toISOString().split('T')[0]
  const past = [...sessionDates.filter((d) => d <= today)].reverse()
  const upcoming = sessionDates.filter((d) => d > today)

  return (
    <div
      className="flex flex-col rounded-xl border border-[--ucsi-border] overflow-hidden"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      <div className="border-b border-[--ucsi-border] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[--text-secondary]">
          Session Dates
        </p>
      </div>

      <div className="flex max-h-[520px] flex-col divide-y divide-[--ucsi-border] overflow-y-auto">
        {past.map((date) => {
          const isDone = markedDates.has(date)
          const isSelected = date === selectedDate
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              className={cn(
                'flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[--ucsi-red]',
                isSelected
                  ? 'border-l-2 border-[var(--ucsi-red,#C1272D)] bg-white/10 pl-[14px]'
                  : 'hover:bg-[--ucsi-red]/15',
              )}
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-[--text-primary]">{formatSessionDate(date)}</p>
                <p className="text-[10px] text-[--text-muted]">Week {getWeekNumber(date, semesterStartDate)}</p>
              </div>
              <Badge variant={isDone ? 'success' : 'warning'} className="shrink-0 text-[10px]">
                {isDone ? 'Done' : 'Pending'}
              </Badge>
            </button>
          )
        })}

        {upcoming.length > 0 && (
          <>
            <div style={{ backgroundColor: 'var(--bg-elevated)' }} className="px-4 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[--text-muted]">
                Upcoming
              </p>
            </div>
            {upcoming.map((date) => (
              <div
                key={date}
                className="flex items-center justify-between gap-2 px-4 py-3 opacity-40"
              >
                <div>
                  <p className="text-xs font-medium text-[--text-primary]">{formatSessionDate(date)}</p>
                  <p className="text-[10px] text-[--text-muted]">Week {getWeekNumber(date, semesterStartDate)}</p>
                </div>
                <Badge variant="neutral" className="text-[10px]">Upcoming</Badge>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
