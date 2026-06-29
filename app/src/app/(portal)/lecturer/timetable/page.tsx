import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { MapPin, Clock, Users } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { getLecturerTimetableData } from '@/services/lecturer-timetable-queries'
import { DAY_LABELS } from '@/lib/utils'

const DAYS = DAY_LABELS.slice(0, 5) // Mon–Fri

export default async function LecturerTimetablePage() {
  const session = await auth()
  const lecturerId = session?.user?.lecturerId
  if (!lecturerId || session.user.role !== 'lecturer') redirect('/login')

  const { semesterName, sessions: teachingSessions } = await getLecturerTimetableData(lecturerId)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[--text-primary]">Teaching Schedule</h1>
        <p className="mt-0.5 text-sm text-[--text-secondary]">{semesterName || 'No active semester'}</p>
      </div>

      {/* ── Mobile agenda view (hidden md+) ─────────────────────── */}
      <div className="flex flex-col gap-4 md:hidden">
        {DAYS.map((day, idx) => {
          const dayNum = idx + 1
          const sessions = teachingSessions.filter((s) => s.dayOfWeek === dayNum)
          return (
            <div key={day}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[--text-secondary]">{day}</p>
              {sessions.length === 0 ? (
                <div className="flex items-center justify-center rounded-xl border border-dashed border-[--ucsi-border] py-5 text-sm text-[--text-muted]">
                  No classes
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {sessions.map((session) => (
                    <div
                      key={session.sectionId}
                      className="flex items-start gap-3 rounded-xl border border-[--ucsi-border] p-4 shadow-sm"
                      style={{ backgroundColor: 'var(--bg-surface)' }}
                    >
                      <div
                        className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg text-white"
                        style={{ backgroundColor: 'var(--ucsi-red)' }}
                      >
                        <span className="text-[10px] font-semibold uppercase leading-none">{day}</span>
                        <span className="mt-1 text-xs font-bold leading-none">{session.timeStart}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[--text-primary]">{session.courseCode}</p>
                            <p className="mt-0.5 text-xs leading-snug text-[--text-secondary]">{session.courseTitle}</p>
                          </div>
                          <Badge variant="ucsi" className="shrink-0 text-[10px]">
                            Sec {session.sectionCode}
                          </Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[--text-secondary]">
                          <span className="flex items-center gap-1">
                            <Clock size={11} aria-hidden="true" />
                            {session.timeStart}–{session.timeEnd}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={11} aria-hidden="true" />
                            {session.room}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={11} aria-hidden="true" />
                            {session.studentCount} students
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
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
              const sessions = teachingSessions.filter((s) => s.dayOfWeek === dayNum)
              return (
                <div key={day} className="flex flex-col gap-2">
                  <p className="text-center text-xs font-semibold uppercase tracking-wide text-[--text-secondary]">{day}</p>
                  {sessions.length === 0 ? (
                    <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-[--ucsi-border] text-xs text-[--text-muted]">
                      Free
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <div
                        key={session.sectionId}
                        className="rounded-lg border border-[#C1272D]/25 bg-red-50 px-3 py-3 dark:bg-red-900/10"
                      >
                        <p className="truncate text-xs font-bold text-[--ucsi-red]">{session.courseCode}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-tight text-[--text-secondary]">{session.courseTitle}</p>
                        <div className="mt-2 flex flex-col gap-0.5 text-[10px] text-[--text-secondary]">
                          <span className="flex items-center gap-1">
                            <Clock size={9} aria-hidden="true" />{session.timeStart}–{session.timeEnd}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={9} aria-hidden="true" />{session.room}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={9} aria-hidden="true" />{session.studentCount} students
                          </span>
                        </div>
                      </div>
                    ))
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
            {[...teachingSessions]
              .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.timeStart.localeCompare(b.timeStart))
              .map((session) => (
                <div key={session.sectionId} className="flex items-center gap-4 py-3.5">
                  <div className="w-10 shrink-0 text-center text-xs font-semibold text-[--text-secondary]">
                    {DAY_LABELS[session.dayOfWeek - 1]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[--text-primary]">
                      {session.courseCode} — {session.courseTitle}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-[--text-secondary]">
                      <span className="flex items-center gap-1"><Clock size={11} aria-hidden="true" />{session.timeStart}–{session.timeEnd}</span>
                      <span className="flex items-center gap-1"><MapPin size={11} aria-hidden="true" />{session.room}</span>
                      <span className="flex items-center gap-1"><Users size={11} aria-hidden="true" />{session.studentCount} students</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-[--text-secondary]">Sec {session.sectionCode}</span>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
