import { MapPin, Clock, User, AlertCircle, Clock3, ShieldCheck } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { DAY_LABELS, formatDate } from '@/lib/utils'
import { getTimetableData } from '@/services/timetable-queries'

import { auth } from '@/auth'
import { redirect } from 'next/navigation'

const DAYS = DAY_LABELS.slice(0, 5) // Mon–Fri

const COURSE_TYPE_VARIANT: Record<string, 'ucsi' | 'neutral'> = {
  core: 'ucsi',
  mpw:  'neutral',
}

const STATUS_META: Record<string, { label: string; variant: 'danger' | 'warning' | 'info'; icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: 'true' }> }> = {
  absent:  { label: 'Absent',  variant: 'danger',  icon: AlertCircle },
  late:    { label: 'Late',    variant: 'warning', icon: Clock3       },
  excused: { label: 'Excused', variant: 'info',    icon: ShieldCheck  },
}

export default async function TimetablePage() {
  const session = await auth()
  const studentId = session?.user?.studentId
  if (!studentId) redirect('/login')
  const data = await getTimetableData(studentId)
  const { semesterName, sections, courses, lecturerNames, attendance } = data
  const sectionById = new Map(sections.map((section) => [section.id, section]))
  const courseById = new Map(courses.map((course) => [course.id, course]))
  const attendanceBySection = new Map<string, typeof attendance>()

  for (const record of attendance) {
    const bucket = attendanceBySection.get(record.sectionId)
    if (bucket) {
      bucket.push(record)
    } else {
      attendanceBySection.set(record.sectionId, [record])
    }
  }

  // Flat chronological list of all non-present records across all courses
  const allNonPresent = [...attendance]
    .filter((r) => r.status !== 'present')
    .map((r) => {
      const sec = sectionById.get(r.sectionId)
      if (!sec) return null
      const course = courseById.get(sec.courseId)
      if (!course) return null
      return { date: r.date, status: r.status, sec, course }
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => b.date.localeCompare(a.date))

  // Per-course attendance summary (counts only)
  const sectionAttendanceSummary = sections.map((sec) => {
    const records = attendanceBySection.get(sec.id) ?? []
    const total = records.length
    const absentCount  = records.filter((r) => r.status === 'absent').length
    const lateCount    = records.filter((r) => r.status === 'late').length
    const excusedCount = records.filter((r) => r.status === 'excused').length
    const presentCount = total - absentCount
    return { sec, total, presentCount, absentCount, lateCount, excusedCount }
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[--text-primary]">Timetable</h1>
        <p className="mt-0.5 text-sm text-[--text-secondary]">{semesterName}</p>
      </div>

      {/* ── Mobile agenda view (hidden md+) ─────────────────────── */}
      <div className="flex flex-col gap-4 md:hidden">
        {DAYS.map((day, idx) => {
          const dayNum = idx + 1
          const sessions = sections.filter((s) => s.dayOfWeek === dayNum)
          return (
            <div key={day}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[--text-secondary]">{day}</p>
              {sessions.length === 0 ? (
                <div className="flex items-center justify-center rounded-xl border border-dashed border-[--ucsi-border] py-5 text-sm text-[--text-muted]">
                  Free day
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {sessions.map((sec) => {
                    const course = courseById.get(sec.courseId)
                    if (!course) return null
                    const lecturerName = lecturerNames[sec.id] ?? null
                    return (
                      <div
                        key={sec.id}
                        className="flex items-start gap-3 rounded-xl border border-[--ucsi-border] p-4 shadow-sm"
                        style={{ backgroundColor: 'var(--bg-surface)' }}
                      >
                        <div
                          className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg text-white"
                          style={{ backgroundColor: 'var(--ucsi-red)' }}
                        >
                          <span className="text-[10px] font-semibold uppercase leading-none">{day}</span>
                          <span className="mt-1 text-xs font-bold leading-none">{sec.timeStart}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[--text-primary]">{course.code}</p>
                              <p className="mt-0.5 text-xs text-[--text-secondary] leading-snug">{course.title}</p>
                            </div>
                            <Badge variant={COURSE_TYPE_VARIANT[course.type] ?? 'neutral'} className="shrink-0 text-[10px]">
                              {course.type.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[--text-secondary]">
                            <span className="flex items-center gap-1">
                              <Clock size={11} aria-hidden="true" />
                              {sec.timeStart}–{sec.timeEnd}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin size={11} aria-hidden="true" />
                              {sec.room ?? '—'}
                            </span>
                            {lecturerName && (
                              <span className="flex items-center gap-1">
                                <User size={11} aria-hidden="true" />
                                {lecturerName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Desktop weekly grid (hidden below md) ───────────────── */}
      <Card className="hidden md:block">
        <CardHeader>
          <h2 className="text-sm font-semibold text-[--text-primary]">Weekly Schedule</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3">
            {DAYS.map((day, idx) => {
              const dayNum = idx + 1
              const sessions = sections.filter((s) => s.dayOfWeek === dayNum)
              return (
                <div key={day} className="flex flex-col gap-2">
                  <p className="text-center text-xs font-semibold uppercase tracking-wide text-[--text-secondary]">{day}</p>
                  {sessions.length === 0 ? (
                    <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-[--ucsi-border] text-xs text-[--text-muted]">
                      Free
                    </div>
                  ) : (
                    sessions.map((sec) => {
                      const course = courseById.get(sec.courseId)
                      if (!course) return null
                      const lecturerName = lecturerNames[sec.id] ?? null
                      return (
                        <div
                          key={sec.id}
                          className="rounded-lg border border-[#C1272D]/25 bg-red-50 px-3 py-3 dark:bg-red-900/10"
                        >
                          <p className="truncate text-xs font-bold text-[--ucsi-red]">{course.code}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-[--text-secondary] leading-tight">{course.title}</p>
                          <div className="mt-2 flex flex-col gap-0.5 text-[10px] text-[--text-secondary]">
                            <span className="flex items-center gap-1">
                              <Clock size={9} aria-hidden="true" />{sec.timeStart}–{sec.timeEnd}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin size={9} aria-hidden="true" />{sec.room ?? '—'}
                            </span>
                            {lecturerName && (
                              <span className="mt-0.5 truncate flex items-center gap-1">
                                <User size={9} aria-hidden="true" />
                                <span className="truncate">{lecturerName}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── All sessions list (desktop supplement) ──────────────── */}
      <Card className="hidden md:block">
        <CardHeader>
          <h2 className="text-sm font-semibold text-[--text-primary]">All Sessions</h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col divide-y divide-[--ucsi-border]">
            {[...sections]
              .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.timeStart.localeCompare(b.timeStart))
              .map((sec) => {
                const course = courseById.get(sec.courseId)
                if (!course) return null
                const lecturerName = lecturerNames[sec.id] ?? null
                return (
                  <div key={sec.id} className="flex items-center gap-4 py-3.5">
                    <div className="w-10 shrink-0 text-center text-xs font-semibold text-[--text-secondary]">
                      {DAY_LABELS[sec.dayOfWeek - 1]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[--text-primary]">
                        {course.code} — {course.title}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-[--text-secondary]">
                        <span className="flex items-center gap-1"><Clock size={11} aria-hidden="true" />{sec.timeStart}–{sec.timeEnd}</span>
                        <span className="flex items-center gap-1"><MapPin size={11} aria-hidden="true" />{sec.room ?? '—'}</span>
                        {lecturerName && (
                          <span className="flex items-center gap-1"><User size={11} aria-hidden="true" />{lecturerName}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-right">
                      <Badge variant={COURSE_TYPE_VARIANT[course.type] ?? 'neutral'}>{course.type.toUpperCase()}</Badge>
                      <span className="text-xs text-[--text-secondary]">Sec {sec.sectionCode}</span>
                    </div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>

      {/* ── Attendance history ───────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div>
            <h2 className="text-sm font-semibold text-[--text-primary]">Attendance History</h2>
            <p className="text-xs text-[--text-secondary]">Missed and late sessions this semester</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">

            {/* Chronological missed sessions — answers "which class on which date" */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[--text-secondary]">
                Missed Sessions
              </h3>
              {allNonPresent.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[--ucsi-border] py-4 text-center text-xs text-[--text-muted]">
                  No absences, late arrivals, or excused sessions recorded — keep it up!
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-[--ucsi-border]">
                  <table
                    className="w-full min-w-[480px] text-sm"
                    aria-label="All missed sessions this semester"
                  >
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-elevated)' }}>
                        <th scope="col" className="py-2.5 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-[--text-secondary]">Date</th>
                        <th scope="col" className="py-2.5 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-[--text-secondary]">Class</th>
                        <th scope="col" className="py-2.5 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-[--text-secondary]">Time</th>
                        <th scope="col" className="py-2.5 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-[--text-secondary]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allNonPresent.map(({ date, status, sec, course }) => {
                        const meta = STATUS_META[status]
                        const Icon = meta.icon
                        return (
                          <tr
                            key={`${sec.id}-${date}`}
                            className="border-t border-[--ucsi-border] hover:bg-zinc-50 dark:hover:bg-white/5"
                          >
                            <td className="py-2.5 pl-4 pr-3 text-xs text-[--text-primary] whitespace-nowrap">
                              {formatDate(date)}
                            </td>
                            <td className="py-2.5 pr-3">
                              <p className="text-xs font-medium text-[--text-primary]">{course.code}</p>
                              <p className="text-[11px] text-[--text-secondary] leading-snug">{course.title}</p>
                            </td>
                            <td className="py-2.5 pr-3 text-xs text-[--text-secondary] whitespace-nowrap">
                              {sec.timeStart}–{sec.timeEnd}
                            </td>
                            <td className="py-2.5 pr-4">
                              <span className="flex items-center gap-1.5">
                                <Icon size={12} aria-hidden="true" />
                                <Badge variant={meta.variant}>{meta.label}</Badge>
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Per-subject attendance summary */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[--text-secondary]">
                Attendance by Subject
              </h3>
              <div className="flex flex-col gap-2">
                {sectionAttendanceSummary.map(({ sec, total, presentCount, absentCount, lateCount, excusedCount }) => {
                  const course = courseById.get(sec.courseId)
                  if (!course) return null
                  return (
                    <div
                      key={sec.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[--ucsi-border] px-4 py-3"
                    >
                      <div>
                        <span className="text-sm font-semibold text-[--text-primary]">{course.code}</span>
                        <span className="ml-2 text-xs text-[--text-secondary]">{course.title}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[--text-secondary]">
                        <span>{presentCount}/{total} attended</span>
                        {absentCount  > 0 && <Badge variant="danger">{absentCount} absent</Badge>}
                        {lateCount    > 0 && <Badge variant="warning">{lateCount} late</Badge>}
                        {excusedCount > 0 && <Badge variant="info">{excusedCount} excused</Badge>}
                        {absentCount === 0 && lateCount === 0 && excusedCount === 0 && (
                          <Badge variant="success">Perfect</Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  )
}
