'use client'

import { useState } from 'react'
import { Download, BookOpen, Clock, MapPin, User } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CourseResultTable } from '@/components/academic/CourseResultTable'
import { formatDate, DAY_LABELS } from '@/lib/utils'
import type {
  Semester,
  Course,
  CourseSection,
  PastSemesterDetail,
  SectionResult,
} from '@/types/academic'

interface Props {
  semesters: Semester[]
  currentData: {
    courses: Course[]
    sections: CourseSection[]
    results: SectionResult[]
    lecturerNames: Record<string, string | null>
  }
  pastData: PastSemesterDetail[]
}

function gradeVariant(grade: string) {
  if (grade.startsWith('A')) return 'success' as const
  if (grade.startsWith('B')) return 'info' as const
  if (grade.startsWith('C')) return 'warning' as const
  return 'danger' as const
}

export function AcademicSemesterView({ semesters, currentData, pastData }: Props) {
  const initialSelectedId = semesters.find((s) => s.isCurrent)?.id ?? semesters[0]?.id ?? null
  const [selectedId, setSelectedId] = useState(initialSelectedId)

  const selected = semesters.find((s) => s.id === selectedId) ?? null
  if (!selected) {
    return (
      <Card>
        <CardContent>
          <p className="py-6 text-center text-sm text-[--text-muted]">
            No semester data available.
          </p>
        </CardContent>
      </Card>
    )
  }

  const isCurrent = selected.isCurrent
  const past = pastData.find((p) => p.semesterId === selectedId)

  return (
    <div className="flex flex-col gap-6">
      {/* Semester picker tabs */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Select semester">
        {[...semesters].reverse().map((sem) => {
          const active = sem.id === selectedId
          return (
            <button
              key={sem.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedId(sem.id)}
              className={
                active
                  ? 'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]'
                  : 'flex items-center gap-1.5 rounded-full border border-[--ucsi-border] px-4 py-1.5 text-sm font-medium text-[--text-secondary] transition-colors hover:bg-[--ucsi-red]/15 hover:text-[#C1272D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]'
              }
              style={active ? { backgroundColor: 'var(--ucsi-red)' } : undefined}
            >
              {sem.name}
              {sem.isCurrent && (
                <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[10px] font-semibold leading-none">
                  Current
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Semester detail card */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[--text-primary]">{selected.name}</h2>
              <p className="text-xs text-[--text-secondary]">
                {formatDate(selected.startDate)} – {formatDate(selected.endDate)}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Badge variant={isCurrent ? 'ucsi' : 'neutral'}>
                {isCurrent ? 'Current' : 'Completed'}
              </Badge>
              {!isCurrent && past && (
                <span className="text-xs font-semibold text-[--text-secondary]">
                  Semester GPA:{' '}
                  <span className="text-[--text-primary]">{past.gpa.toFixed(2)}</span>
                </span>
              )}
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-md border border-[--ucsi-border] px-2.5 py-1.5 text-xs font-medium text-[--text-secondary] transition-colors hover:bg-[--ucsi-red]/15 hover:text-[#C1272D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]"
                aria-label={`Download transcript for ${selected.name}`}
              >
                <Download size={12} aria-hidden="true" />
                {isCurrent ? 'Download Transcript' : 'Download PDF'}
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isCurrent ? (
            <>
              {/* Enrolled courses + results */}
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[--text-secondary]">
                Enrolled Courses
              </h3>
              <CourseResultTable
                courses={currentData.courses}
                sections={currentData.sections}
                results={currentData.results}
              />
              <p className="mt-3 flex items-center gap-1 text-[10px] text-[--text-muted]">
                <BookOpen size={10} aria-hidden="true" />
                Grades shown as — are not yet published.
              </p>

              {/* Class schedule */}
              <div className="mt-6 border-t border-[--ucsi-border] pt-5">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[--text-secondary]">
                  Class Schedule
                </h3>
                <div className="overflow-x-auto rounded-lg border border-[--ucsi-border]">
                  <table
                    className="w-full min-w-[500px] text-left"
                    aria-label="Class schedule for current semester"
                  >
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-elevated)' }}>
                        {['Course', 'Section', 'Day', 'Time', 'Room', 'Lecturer'].map((h) => (
                          <th
                            key={h}
                            scope="col"
                            className="py-2.5 pl-4 pr-3 text-[10px] font-semibold uppercase tracking-wide text-[--text-secondary]"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...currentData.sections]
                        .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.timeStart.localeCompare(b.timeStart))
                        .map((sec) => {
                          const course = currentData.courses.find((c) => c.id === sec.courseId)
                          if (!course) return null
                          const lecturer = currentData.lecturerNames[sec.id]
                          return (
                            <tr
                              key={sec.id}
                              className="border-t border-[--ucsi-border] hover:bg-zinc-50 dark:hover:bg-white/5"
                            >
                              <td className="py-3 pl-4 pr-3">
                                <p className="text-xs font-medium text-[--text-primary]">{course.code}</p>
                                <p className="mt-0.5 text-[11px] text-[--text-secondary] leading-snug">{course.title}</p>
                              </td>
                              <td className="py-3 pr-3 text-xs text-[--text-secondary]">
                                {sec.sectionCode}
                              </td>
                              <td className="py-3 pr-3 text-xs text-[--text-secondary]">
                                <span className="flex items-center gap-1">
                                  <Clock size={11} aria-hidden="true" />
                                  {DAY_LABELS[sec.dayOfWeek - 1]}
                                </span>
                              </td>
                              <td className="py-3 pr-3 text-xs text-[--text-secondary] whitespace-nowrap">
                                {sec.timeStart}–{sec.timeEnd}
                              </td>
                              <td className="py-3 pr-3 text-xs text-[--text-secondary]">
                                <span className="flex items-center gap-1">
                                  <MapPin size={11} aria-hidden="true" />
                                  {sec.room ?? '—'}
                                </span>
                              </td>
                              <td className="py-3 pr-3 text-xs text-[--text-secondary]">
                                <span className="flex items-center gap-1">
                                  <User size={11} aria-hidden="true" />
                                  {lecturer ?? '—'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : past ? (
            <>
              <div className="overflow-x-auto rounded-lg border border-[--ucsi-border]">
                <table className="w-full min-w-[520px] text-left" aria-label={`Results for ${selected.name}`}>
                  <thead>
                    <tr>
                      {['Code', 'Subject', 'Cr', 'Grade', 'GP', 'Att.', 'Standing'].map((h) => (
                        <th
                          key={h}
                          className="py-2.5 pl-4 pr-3 text-[10px] font-semibold uppercase tracking-wide text-[--text-secondary]"
                          style={{ backgroundColor: 'var(--bg-elevated)' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {past.courses.map((c) => (
                      <tr
                        key={c.code}
                        className="border-t border-[--ucsi-border] hover:bg-zinc-50 dark:hover:bg-white/5"
                      >
                        <td className="py-3 pl-4 pr-3 text-xs font-mono text-[--text-secondary]">{c.code}</td>
                        <td className="py-3 pr-3 text-sm text-[--text-primary]">{c.title}</td>
                        <td className="py-3 pr-3 text-center text-xs text-[--text-secondary]">{c.credits}</td>
                        <td className="py-3 pr-3 text-center">
                          <Badge variant={gradeVariant(c.grade)}>{c.grade}</Badge>
                        </td>
                        <td className="py-3 pr-3 text-center text-xs text-[--text-secondary]">{c.gradePoint.toFixed(1)}</td>
                        <td className="py-3 pr-3 text-center text-xs text-[--text-secondary]">{c.attendancePercentage}%</td>
                        <td className="py-3 pr-3 text-center">
                          <Badge variant="success">{c.standing}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[--ucsi-border]">
                      <td colSpan={2} className="py-2.5 pl-4 pr-3 text-xs font-semibold text-[--text-secondary]">
                        Total credits
                      </td>
                      <td className="py-2.5 pr-3 text-center text-xs font-bold text-[--text-primary]">
                        {past.totalCredits}
                      </td>
                      <td colSpan={4} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          ) : (
            <p className="py-6 text-center text-sm text-[--text-muted]">No results available for this semester.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
