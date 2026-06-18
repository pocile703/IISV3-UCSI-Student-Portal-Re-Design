import { Badge } from '@/components/ui/Badge'
import type { Course, CourseSection, SectionResult } from '@/types/academic'

function gradeVariant(grade: string | null) {
  if (!grade) return 'neutral' as const
  if (grade.startsWith('A')) return 'success' as const
  if (grade.startsWith('B')) return 'info' as const
  if (grade.startsWith('C')) return 'warning' as const
  return 'danger' as const
}

interface CourseResultRowProps {
  course: Course
  section: CourseSection
  result: SectionResult | undefined
}

export function CourseResultRow({ course, section, result }: CourseResultRowProps) {
  return (
    <tr className="border-b border-[--ucsi-border] last:border-0 hover:bg-zinc-50 dark:hover:bg-white/5">
      <td
        className="sticky left-0 z-10 py-3 pl-4 pr-3 text-xs font-mono text-[--text-secondary]"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >{course.code}</td>
      <td className="py-3 pr-3 text-sm text-[--text-primary]">{course.title}</td>
      <td className="py-3 pr-3 text-center text-xs text-[--text-secondary]">{course.credits}</td>
      <td className="py-3 pr-3 text-center">
        {result?.isPublished && result.grade ? (
          <Badge variant={gradeVariant(result.grade)}>{result.grade}</Badge>
        ) : (
          <span className="text-xs text-[--text-muted]">—</span>
        )}
      </td>
      <td className="py-3 pr-3 text-center text-xs text-[--text-secondary]">
        {result ? `${result.attendancePercentage}%` : '—'}
      </td>
      <td className="py-3 pr-4 text-center">
        <Badge variant={result?.standing === 'Pass' ? 'success' : 'neutral'}>
          {result?.standing ?? 'Enrolled'}
        </Badge>
      </td>
      <td className="py-3 pr-3 text-center text-xs text-[--text-muted]">{section.room ?? '—'}</td>
    </tr>
  )
}

interface CourseResultTableProps {
  courses: Course[]
  sections: CourseSection[]
  results: SectionResult[]
}

export function CourseResultTable({ courses, sections, results }: CourseResultTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[--ucsi-border]">
      <table className="w-full min-w-[600px] text-left">
        <thead style={{ backgroundColor: 'var(--bg-elevated)' }}>
          <tr>
            {['Code', 'Subject', 'Cr', 'Grade', 'Att.', 'Standing', 'Room'].map((h, i) => (
              <th
                key={h}
                style={i === 0 ? { backgroundColor: 'var(--bg-elevated)' } : undefined}
                className={`py-2.5 pl-4 pr-3 text-[10px] font-semibold uppercase tracking-wide text-[--text-secondary]${i === 0 ? ' sticky left-0 z-10' : ''}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sections.map((sec) => {
            const course = courses.find((c) => c.id === sec.courseId)
            const result = results.find((r) => r.sectionId === sec.id)
            if (!course) return null
            return <CourseResultRow key={sec.id} course={course} section={sec} result={result} />
          })}
        </tbody>
      </table>
    </div>
  )
}
