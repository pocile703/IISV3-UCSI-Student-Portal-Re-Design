'use client'

import { Fragment, useState } from 'react'
import { Edit2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { DAY_LABELS } from '@/lib/utils'
import type { SectionPageRow, SectionFormData, SectionStats } from '@/types/admin-sections'
import { SectionModal } from './SectionModal'

type ModalState =
  | { mode: 'create' }
  | { mode: 'edit'; section: SectionPageRow }
  | null

type Props = {
  initialSections: SectionPageRow[]
  formData: SectionFormData
  stats: SectionStats
}

export function SectionTable({ initialSections, formData, stats }: Props) {
  const [search, setSearch] = useState('')
  const [semFilter, setSemFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [modal, setModal] = useState<ModalState>(null)

  // Unique semesters in display order (derived from initialSections sorted by startDate desc)
  const semesterOptions = [
    ...new Map(initialSections.map((r) => [r.semesterId, r.semesterName])).entries(),
  ]

  // Client-side filtering
  const filtered = initialSections.filter((r) => {
    if (semFilter !== 'all' && r.semesterId !== semFilter) return false
    if (statusFilter === 'active' && !r.isActive) return false
    if (statusFilter === 'inactive' && r.isActive) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        r.courseCode.toLowerCase().includes(q) ||
        r.courseTitle.toLowerCase().includes(q) ||
        r.sectionCode.toLowerCase().includes(q) ||
        (r.room ?? '').toLowerCase().includes(q) ||
        (r.lecturerName ?? '').toLowerCase().includes(q)
      )
    }
    return true
  })

  // Group by semester — order from initialSections (stable), map to filtered rows, drop empty groups
  const semesterOrder = [...new Set(initialSections.map((r) => r.semesterId))]
  const groups = semesterOrder
    .map((semId) => ({
      semId,
      semName: initialSections.find((r) => r.semesterId === semId)?.semesterName ?? '',
      rows: filtered.filter((r) => r.semesterId === semId),
    }))
    .filter((g) => g.rows.length > 0)

  return (
    <>
      <div className="flex flex-col gap-8">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[--text-primary]">Section Management</h1>
            <p className="mt-0.5 text-sm text-[--text-secondary]">
              Timetable edit surface · Administrator
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModal({ mode: 'create' })}
            className="cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--ucsi-red)' }}
          >
            + Add Section
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {(
            [
              { label: 'Active Sections', value: stats.totalActive },
              { label: 'Inactive Sections', value: stats.totalInactive },
              { label: 'Teaching Assignments', value: stats.totalAssignments },
              { label: 'Student Seats Filled', value: stats.totalSeatsUsed },
            ] as const
          ).map(({ label, value }) => (
            <Card key={label}>
              <CardContent className="pt-5">
                <p className="text-xs text-[--text-secondary]">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-[--text-primary]">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Search course, code, room, lecturer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-[--ucsi-border] bg-transparent px-3 py-1.5 text-sm text-[--text-primary] focus:outline-none focus:ring-2 focus:ring-[#C1272D]/50 sm:w-72"
          />
          <select
            value={semFilter}
            onChange={(e) => setSemFilter(e.target.value)}
            className="rounded-md border border-[--ucsi-border] bg-transparent px-3 py-1.5 text-sm text-[--text-primary]"
          >
            <option value="all">All Semesters</option>
            {semesterOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === f
                    ? 'text-white'
                    : 'border border-[--ucsi-border] text-[--text-secondary] hover:bg-zinc-50 dark:hover:bg-white/5'
                }`}
                style={statusFilter === f ? { backgroundColor: 'var(--ucsi-red)' } : {}}
              >
                {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm" aria-label="Course sections">
              <thead>
                <tr
                  className="border-b border-[--ucsi-border]"
                  style={{ backgroundColor: 'var(--bg-elevated)' }}
                >
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[--text-secondary]">Course</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[--text-secondary]">Code</th>
                  <th scope="col" className="hidden px-4 py-3 text-left text-xs font-medium text-[--text-secondary] sm:table-cell">Schedule</th>
                  <th scope="col" className="hidden px-4 py-3 text-left text-xs font-medium text-[--text-secondary] sm:table-cell">Lecturer</th>
                  <th scope="col" className="hidden px-4 py-3 text-left text-xs font-medium text-[--text-secondary] md:table-cell">Enrolled</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[--text-secondary]">Status</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-[--text-secondary]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-[--text-muted]">
                      No sections match the current filters.
                    </td>
                  </tr>
                ) : (
                  groups.map(({ semId, semName, rows }) => (
                    <Fragment key={semId}>
                      {/* Semester group header */}
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-2 text-xs font-semibold text-[--text-secondary]"
                          style={{ backgroundColor: 'var(--bg-elevated)' }}
                        >
                          {semName}
                          <span className="ml-2 rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] text-zinc-600 dark:bg-white/10 dark:text-zinc-400">
                            {rows.length}
                          </span>
                        </td>
                      </tr>

                      {/* Section rows */}
                      {rows.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-[--ucsi-border] hover:bg-zinc-50 dark:hover:bg-white/5"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-[--text-primary]">{row.courseCode}</p>
                            <p className="hidden text-xs text-[--text-secondary] sm:block">{row.courseTitle}</p>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-[--text-primary]">{row.sectionCode}</td>
                          <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-[--text-secondary] sm:table-cell">
                            {DAY_LABELS[row.dayOfWeek]} · {row.timeStart}–{row.timeEnd}
                            {row.room && <span className="text-[--text-muted]"> · {row.room}</span>}
                          </td>
                          <td className="hidden px-4 py-3 text-xs text-[--text-secondary] sm:table-cell">
                            {row.lecturerName ?? <span className="text-[--text-muted]">Unassigned</span>}
                          </td>
                          <td className="hidden px-4 py-3 text-xs text-[--text-secondary] md:table-cell">
                            {row.enrolledCount} / {row.maxCapacity}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={row.isActive ? 'success' : 'neutral'}
                              aria-label={`Status: ${row.isActive ? 'Active' : 'Inactive'}`}
                            >
                              {row.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setModal({ mode: 'edit', section: row })}
                              aria-label={`Edit ${row.courseCode} ${row.sectionCode}`}
                              className="cursor-pointer rounded p-1 text-[--text-secondary] hover:bg-zinc-100 dark:hover:bg-white/10"
                            >
                              <Edit2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Modal — rendered outside layout div so it sits above everything */}
      {modal && (
        <SectionModal
          mode={modal.mode}
          section={modal.mode === 'edit' ? modal.section : undefined}
          formData={formData}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
