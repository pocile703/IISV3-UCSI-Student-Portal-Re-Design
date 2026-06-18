import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { DAY_LABELS } from '@/lib/utils'
import type { Course, CourseSection } from '@/types/academic'

interface LecturerSectionRowProps {
  section: CourseSection
  course: Course
  studentCount: number
  resourceCount: number
  urgentPostCount: number
}

export function LecturerSectionRow({
  section,
  course,
  studentCount,
  resourceCount,
  urgentPostCount,
}: LecturerSectionRowProps) {
  const day = DAY_LABELS[section.dayOfWeek - 1]
  return (
    <div className="flex flex-wrap items-center gap-3 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-bold" style={{ color: 'var(--ucsi-red)' }}>
            {course.code}
          </span>
          <span className="text-sm text-[--text-primary]">{course.title}</span>
        </div>
        <p className="mt-0.5 text-xs text-[--text-secondary]">
          Sec {section.sectionCode} · {section.room ?? '—'} · {day} {section.timeStart}–{section.timeEnd}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="neutral">{studentCount} students</Badge>
          <span className="text-xs text-[--text-secondary]">{resourceCount} resources</span>
          {urgentPostCount > 0 && (
            <Badge variant="warning">{urgentPostCount} priority</Badge>
          )}
        </div>
      </div>
      <Link
        href={`/lecturer/resources/${section.id}`}
        className="shrink-0 rounded-md border border-[--ucsi-border] px-3 py-2.5 text-xs font-medium text-[--text-secondary] transition-colors hover:bg-[--ucsi-red]/15 hover:text-[#C1272D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]"
      >
        Open →
      </Link>
    </div>
  )
}
