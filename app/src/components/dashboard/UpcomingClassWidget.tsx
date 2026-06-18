import { Clock, MapPin, User } from 'lucide-react'
import { DAY_LABELS } from '@/lib/utils'

interface ClassScheduleItemProps {
  courseCode: string
  courseTitle: string
  room: string
  dayOfWeek: number
  timeStart: string
  timeEnd: string
  lecturerName?: string
}

export function ClassScheduleItem({ courseCode, courseTitle, room, dayOfWeek, timeStart, timeEnd, lecturerName }: ClassScheduleItemProps) {
  return (
    <div className="flex items-stretch gap-3 rounded-xl border border-[--ucsi-border] p-4" style={{ backgroundColor: 'var(--bg-elevated)' }}>
      <div
        className="flex w-12 shrink-0 flex-col items-center justify-center rounded-lg text-white"
        style={{ backgroundColor: 'var(--ucsi-red)' }}
      >
        <span className="text-[10px] font-semibold uppercase leading-none tracking-wide">{DAY_LABELS[dayOfWeek - 1]}</span>
        <span className="mt-1 text-sm font-bold leading-none">{timeStart.slice(0, 5)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[--text-primary]">{courseCode}</p>
        <p className="mt-0.5 truncate text-xs text-[--text-secondary]">{courseTitle}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[--text-secondary]">
          <span className="flex items-center gap-1"><Clock size={10} aria-hidden="true" />{timeStart}–{timeEnd}</span>
          <span className="flex items-center gap-1"><MapPin size={10} aria-hidden="true" />{room}</span>
          {lecturerName && (
            <span className="flex items-center gap-1"><User size={10} aria-hidden="true" />{lecturerName}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export function UpcomingClassWidget() {
  return null
}
