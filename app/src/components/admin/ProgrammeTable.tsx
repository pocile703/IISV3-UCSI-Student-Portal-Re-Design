'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { ProgrammeModal } from './ProgrammeModal'
import type { ProgrammePageRow } from '@/types/admin-programmes'

type StatusFilter = 'all' | 'active' | 'inactive'
type ModalState =
  | { mode: 'create' }
  | { mode: 'edit'; programme: ProgrammePageRow }
  | null

function lecturerSummary(names: string[]): string {
  if (names.length === 0) return '—'
  if (names.length === 1) return names[0]
  return `${names[0]} +${names.length - 1} more`
}

export function ProgrammeTable({
  initialProgrammes,
}: {
  initialProgrammes: ProgrammePageRow[]
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [modal, setModal] = useState<ModalState>(null)

  const filtered = initialProgrammes.filter(p => {
    const q = search.toLowerCase()
    const matchesSearch =
      q === '' ||
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q)
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && p.isActive) ||
      (statusFilter === 'inactive' && !p.isActive)
    return matchesSearch && matchesStatus
  })

  const activeCount = initialProgrammes.filter(p => p.isActive).length
  const inactiveCount = initialProgrammes.filter(p => !p.isActive).length

  return (
    <>
      <div className="flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[--text-primary]">
              Programme Management
            </h1>
            <p className="mt-0.5 text-sm text-[--text-secondary]">
              Create, edit, and manage degree programmes
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModal({ mode: 'create' })}
            aria-label="Add new programme"
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--ucsi-red)' }}
          >
            <Plus size={14} aria-hidden="true" />
            Add Programme
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            placeholder="Search by name or code…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-xs rounded-md border border-[--ucsi-border] bg-transparent px-3 py-1.5 text-sm text-[--text-primary] placeholder:text-[--text-muted] focus:outline-none focus:ring-2 focus:ring-[#C1272D]/50"
            style={{ backgroundColor: 'var(--bg-surface)' }}
            suppressHydrationWarning
          />
          <div className="flex gap-2" role="group" aria-label="Filter by status">
            {(
              [
                { key: 'all', label: `All (${initialProgrammes.length})` },
                { key: 'active', label: `Active (${activeCount})` },
                { key: 'inactive', label: `Inactive (${inactiveCount})` },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={
                  statusFilter === key
                    ? 'rounded-full px-3 py-1 text-xs font-medium capitalize text-white'
                    : 'rounded-full border border-[--ucsi-border] px-3 py-1 text-xs font-medium capitalize text-[--text-secondary] hover:bg-[--ucsi-red]/15 hover:text-[#C1272D]'
                }
                style={
                  statusFilter === key
                    ? { backgroundColor: 'var(--ucsi-red)' }
                    : { backgroundColor: 'var(--bg-elevated)' }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Programme table */}
        <section aria-label="Programme list">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table
                  className="min-w-[48rem] w-full text-sm"
                  aria-label="Programmes"
                >
                  <thead>
                    <tr className="border-b border-[--ucsi-border]">
                      <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-[--text-secondary]">
                        Code
                      </th>
                      <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-[--text-secondary]">
                        Programme
                      </th>
                      <th scope="col" className="hidden px-5 py-3 text-right text-xs font-medium text-[--text-secondary] sm:table-cell">
                        Students
                      </th>
                      <th scope="col" className="hidden px-5 py-3 text-right text-xs font-medium text-[--text-secondary] sm:table-cell">
                        Sections
                      </th>
                      <th scope="col" className="hidden px-5 py-3 text-left text-xs font-medium text-[--text-secondary] sm:table-cell">
                        Lecturers
                      </th>
                      <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-[--text-secondary]">
                        Status
                      </th>
                      <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-[--text-secondary]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[--ucsi-border]">
                    {filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-8 text-center text-sm text-[--text-muted]"
                        >
                          No programmes found
                        </td>
                      </tr>
                    ) : (
                      filtered.map(prog => (
                        <tr
                          key={prog.id}
                          className="hover:bg-zinc-50 dark:hover:bg-white/5"
                        >
                          <td className="px-5 py-3">
                            <Badge variant="ucsi">{prog.code}</Badge>
                          </td>
                          <td className="px-5 py-3 font-medium text-[--text-primary]">
                            {prog.name}
                          </td>
                          <td className="hidden px-5 py-3 text-right text-[--text-secondary] sm:table-cell">
                            {prog.studentCount}
                          </td>
                          <td className="hidden px-5 py-3 text-right text-[--text-secondary] sm:table-cell">
                            {prog.sectionCount}
                          </td>
                          <td className="hidden px-5 py-3 text-[--text-secondary] sm:table-cell">
                            {lecturerSummary(prog.lecturerNames)}
                          </td>
                          <td className="px-5 py-3">
                            <Badge
                              variant={prog.isActive ? 'success' : 'danger'}
                              aria-label={`Status: ${prog.isActive ? 'Active' : 'Inactive'}`}
                            >
                              {prog.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setModal({ mode: 'edit', programme: prog })
                              }
                              aria-label={`Edit ${prog.name}`}
                              className="cursor-pointer text-xs font-medium hover:underline"
                              style={{ color: 'var(--ucsi-red)' }}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

      </div>

      {/* Modal — rendered outside the layout div so it sits above the table */}
      {modal && (
        <ProgrammeModal
          mode={modal.mode}
          programme={modal.mode === 'edit' ? modal.programme : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
