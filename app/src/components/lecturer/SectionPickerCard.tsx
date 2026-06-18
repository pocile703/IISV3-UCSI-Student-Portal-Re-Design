import Link from 'next/link'
import { FileText, MessageSquare, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate, DAY_LABELS } from '@/lib/utils'
import type { Course, CourseSection } from '@/types/academic'

interface Props {
  section: CourseSection
  course: Course
  resourceCount: number
  postCount: number
  urgentCount: number
  studentCount: number
  lastActivity: string
}

export function SectionPickerCard({
  section,
  course,
  resourceCount,
  postCount,
  urgentCount,
  studentCount,
  lastActivity,
}: Props) {
  const day = DAY_LABELS[section.dayOfWeek - 1]

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        {/* Course header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-sm font-bold" style={{ color: 'var(--ucsi-red)' }}>
                {course.code}
              </span>
              <span className="text-sm font-medium text-[--text-primary]">{course.title}</span>
            </div>
            <p className="mt-0.5 text-xs text-[--text-secondary]">
              Sec {section.sectionCode} · {section.room ?? '—'} · {day} {section.timeStart}–{section.timeEnd}
            </p>
          </div>
          {urgentCount > 0 && (
            <Badge variant="danger" className="shrink-0">{urgentCount} urgent</Badge>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1 text-xs text-[--text-secondary]">
            <FileText size={12} aria-hidden="true" />
            {resourceCount} resources
          </span>
          <span className="flex items-center gap-1 text-xs text-[--text-secondary]">
            <MessageSquare size={12} aria-hidden="true" />
            {postCount} posts
          </span>
          <span className="flex items-center gap-1 text-xs text-[--text-secondary]">
            <Users size={12} aria-hidden="true" />
            {studentCount} students
          </span>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-[--text-muted]">Last activity {formatDate(lastActivity)}</p>
          <Link
            href={`/lecturer/resources/${section.id}`}
            className="shrink-0 rounded-md border border-[--ucsi-border] px-3 py-2 text-xs font-medium text-[--text-secondary] transition-colors hover:bg-[--ucsi-red]/15 hover:text-[#C1272D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]"
          >
            Manage Section →
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
