'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import {
  MOCK_ALL_LECTURERS,
  MOCK_PROGRAMMES,
  MOCK_SECTION_ENROLLMENT,
  MOCK_TEACHING_ASSIGNMENTS,
} from '@/data/mock-admin'
import { mockCourseSections, mockCourses } from '@/data/mock-courses'

type Tab = 'lecturers' | 'programmes'

export function LecturerAssignmentsCard() {
  const [tab, setTab] = useState<Tab>('lecturers')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[--text-primary]">
              Lecturer Assignments
            </h2>
            <p className="text-xs text-[--text-secondary]">Semester 1 2023/24</p>
          </div>
          <div className="flex gap-1">
            {(['lecturers', 'programmes'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={
                  tab === t
                    ? 'rounded-md px-3 py-1 text-xs font-medium capitalize text-white transition-colors'
                    : 'rounded-md border border-[--ucsi-border] px-3 py-1 text-xs font-medium capitalize text-[--text-secondary] transition-colors hover:bg-[--ucsi-red]/15 hover:text-[#C1272D]'
                }
                style={tab === t ? { backgroundColor: 'var(--ucsi-red)' } : undefined}
              >
                {t === 'lecturers' ? 'Lecturers' : 'Programmes'}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tab === 'lecturers' ? <LecturersTab /> : <ProgrammesTab />}
      </CardContent>
    </Card>
  )
}

function LecturersTab() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" aria-label="Lecturer assignments">
        <thead>
          <tr className="border-b border-[--ucsi-border]">
            <th scope="col" className="pb-2 text-left text-xs font-medium text-[--text-secondary]">Name</th>
            <th scope="col" className="pb-2 text-left text-xs font-medium text-[--text-secondary]">
              Sections
            </th>
            <th scope="col" className="pb-2 text-right text-xs font-medium text-[--text-secondary]">
              Students
            </th>
            <th scope="col" className="pb-2 text-right text-xs font-medium text-[--text-secondary]" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[--ucsi-border]">
          {Object.entries(MOCK_ALL_LECTURERS).map(([lecId, { name, staffId }]) => {
            const sectionIds = MOCK_TEACHING_ASSIGNMENTS[lecId] ?? []
            const totalStudents = sectionIds.reduce(
              (sum, sId) => sum + (MOCK_SECTION_ENROLLMENT[sId] ?? 0),
              0,
            )
            const sectionLabels = sectionIds.map((sId) => {
              const sec = mockCourseSections.find((s) => s.id === sId)
              const course = sec ? mockCourses.find((c) => c.id === sec.courseId) : null
              return course ? course.code : sId
            })
            return (
              <tr key={lecId}>
                <td className="py-2.5 pr-4">
                  <p className="font-medium text-[--text-primary]">{name}</p>
                  <p className="text-xs text-[--text-secondary]">{staffId}</p>
                </td>
                <td className="py-2.5 pr-4">
                  {sectionIds.length === 0 ? (
                    <Badge variant="warning">Unassigned</Badge>
                  ) : (
                    <p className="text-xs text-[--text-secondary]">
                      {sectionLabels.join(', ')}
                    </p>
                  )}
                </td>
                <td className="py-2.5 pr-4 text-right text-[--text-primary]">
                  {totalStudents}
                </td>
                <td className="py-2.5 text-right">
                  <Link
                    href="/admin/users"
                    className="text-xs font-medium hover:underline"
                    style={{ color: 'var(--ucsi-red)' }}
                  >
                    View →
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ProgrammesTab() {
  return (
    <div className="flex flex-col divide-y divide-[--ucsi-border]">
      {MOCK_PROGRAMMES.map((prog) => {
        const barWidth = Math.min(100, prog.totalStudents)
        return (
          <div
            key={prog.id}
            className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="ucsi">{prog.code}</Badge>
                <span className="truncate text-sm font-medium text-[--text-primary]">
                  {prog.name}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div
                  className="h-1 flex-1 overflow-hidden rounded-full"
                  style={{ backgroundColor: 'var(--bg-elevated)' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: 'var(--ucsi-red)',
                    }}
                  />
                </div>
                <span className="shrink-0 text-xs text-[--text-secondary]">
                  {prog.totalStudents} students · {prog.totalSections} sections
                </span>
              </div>
            </div>
            <Link
              href="/admin/programmes"
              className="shrink-0 text-xs font-medium hover:underline"
              style={{ color: 'var(--ucsi-red)' }}
            >
              View →
            </Link>
          </div>
        )
      })}
    </div>
  )
}
