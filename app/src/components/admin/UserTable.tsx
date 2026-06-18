'use client'

import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { UserPageRow } from '@/types/admin-users'
import { EditUserModal } from './EditUserModal'
import { CreateUserModal } from './CreateUserModal'

type Tab = 'students' | 'lecturers'

type Props = {
  initialUsers: UserPageRow[]
  currentAdminId: string
}

export function UserTable({ initialUsers, currentAdminId }: Props) {
  const [users, setUsers] = useState<UserPageRow[]>(initialUsers)
  const [editTarget, setEditTarget] = useState<UserPageRow | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('students')
  const [search, setSearch] = useState('')
  const [programmeFilter, setProgrammeFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('')

  const allStudents = users.filter((u) => u.role === 'STUDENT')
  // Lecturers tab shows both LECTURER and ADMIN so a promoted lecturer can be found + reverted
  const allStaff = users.filter(
    (u) => u.role === 'LECTURER' || u.role === 'ADMIN',
  )

  // Derive department filter options from actual DB values (full strings, not short codes)
  const deptOptions = [
    ...new Set(allStaff.map((u) => u.department).filter((d): d is string => d !== null)),
  ].sort()

  const q = search.toLowerCase()

  const filteredStudents = allStudents.filter((u) => {
    const matchSearch =
      (u.fullName ?? '').toLowerCase().includes(q) ||
      (u.studentNumber ?? '').toLowerCase().includes(q)
    const matchProgramme =
      !programmeFilter || u.programmeCode === programmeFilter
    return matchSearch && matchProgramme
  })

  const filteredStaff = allStaff.filter((u) => {
    const matchSearch =
      (u.fullName ?? '').toLowerCase().includes(q) ||
      (u.staffNumber ?? '').toLowerCase().includes(q) ||
      u.emailInstitutional.toLowerCase().includes(q)
    const matchDept = !deptFilter || u.department === deptFilter
    return matchSearch && matchDept
  })

  const activeRows =
    tab === 'students' ? filteredStudents.length : filteredStaff.length
  const unit = tab === 'students' ? 'student' : 'lecturer'

  function switchTab(next: Tab) {
    setTab(next)
    setSearch('')
    setProgrammeFilter('')
    setDeptFilter('')
  }

  function handleEditSuccess(updated: UserPageRow) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    // router.refresh() is called inside EditUserModal after onSuccess —
    // it triggers the server re-fetch + snapshot-key remount for server-truth re-sync.
  }

  function handleUserCreated(newUser: UserPageRow) {
    setUsers((prev) => [newUser, ...prev])
    // router.refresh() called inside CreateUserModal — server-truth remount follows.
  }

  return (
    <>
      <Card>
        {/* Card header */}
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[--text-primary]">
                All Users
              </h2>
              <p className="text-xs text-[--text-secondary]">
                {activeRows} {unit}
                {activeRows !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              type="button"
              aria-label="Add new user"
              onClick={() => setCreateOpen(true)}
              className="flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--ucsi-red)' }}
            >
              <Plus size={14} aria-hidden="true" />
              Add User
            </button>
          </div>
        </CardHeader>

        {/* Tab bar */}
        <div className="border-b border-[--ucsi-border] px-5">
          <div role="tablist" aria-label="User role tabs" className="flex flex-wrap gap-1">
            {(['students', 'lecturers'] as Tab[]).map((t) => (
              <button
                key={t}
                id={`tab-${t}`}
                role="tab"
                aria-selected={tab === t}
                aria-controls={`panel-${t}`}
                tabIndex={tab === t ? 0 : -1}
                onClick={() => switchTab(t)}
                className={
                  tab === t
                    ? 'rounded-t-md px-4 py-2 text-xs font-medium text-white transition-colors'
                    : 'rounded-t-md border border-b-0 border-[--ucsi-border] px-4 py-2 text-xs font-medium text-[--text-secondary] transition-colors hover:bg-[--ucsi-red]/15 hover:text-[#C1272D]'
                }
                style={tab === t ? { backgroundColor: 'var(--ucsi-red)' } : undefined}
              >
                {t === 'students'
                  ? `Students (${allStudents.length})`
                  : `Lecturers (${allStaff.length})`}
              </button>
            ))}
          </div>
        </div>

        <CardContent>
          {/* Search + filter row */}
          <div className="mb-4 flex flex-wrap gap-3 pt-1">
            <div className="relative flex min-w-[180px] flex-1 items-center">
              <Search
                size={14}
                className="absolute left-3 text-[--text-muted]"
                aria-hidden="true"
              />
              <input
                type="text"
                aria-label="Search users"
                placeholder="Search by name or ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-[--ucsi-border] bg-transparent py-1.5 pl-8 pr-3 text-sm text-[--text-primary] placeholder:text-[--text-muted] focus:outline-none focus:ring-1 focus:ring-[--ucsi-red]"
              />
            </div>

            {tab === 'students' && (
              <select
                aria-label="Filter by programme"
                value={programmeFilter}
                onChange={(e) => setProgrammeFilter(e.target.value)}
                className="rounded-md border border-[--ucsi-border] bg-transparent px-3 py-1.5 text-sm text-[--text-primary]"
              >
                <option value="">All Programmes</option>
                <option value="DIT">DIT</option>
                <option value="DBM">DBM</option>
                <option value="DAC">DAC</option>
              </select>
            )}

            {tab === 'lecturers' && (
              <select
                aria-label="Filter by department"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="rounded-md border border-[--ucsi-border] bg-transparent px-3 py-1.5 text-sm text-[--text-primary]"
              >
                <option value="">All Departments</option>
                {deptOptions.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Tab panels */}
          <div
            id="panel-students"
            role="tabpanel"
            aria-labelledby="tab-students"
            hidden={tab !== 'students'}
          >
            {tab === 'students' && (
              <StudentsTable
                rows={filteredStudents}
                currentAdminId={currentAdminId}
                onEdit={setEditTarget}
              />
            )}
          </div>
          <div
            id="panel-lecturers"
            role="tabpanel"
            aria-labelledby="tab-lecturers"
            hidden={tab !== 'lecturers'}
          >
            {tab === 'lecturers' && (
              <StaffTable
                rows={filteredStaff}
                currentAdminId={currentAdminId}
                onEdit={setEditTarget}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals — rendered outside Card so they overlay the full viewport */}
      {editTarget && (
        <EditUserModal
          user={editTarget}
          onSuccess={handleEditSuccess}
          onClose={() => setEditTarget(null)}
        />
      )}
      {createOpen && (
        <CreateUserModal
          onSuccess={handleUserCreated}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </>
  )
}

// ─── Students table ───────────────────────────────────────────────────────────

function StudentsTable({
  rows,
  currentAdminId,
  onEdit,
}: {
  rows: UserPageRow[]
  currentAdminId: string
  onEdit: (u: UserPageRow) => void
}) {
  if (rows.length === 0) return <EmptyState />
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[36rem] w-full text-sm" aria-label="Students">
        <thead>
          <tr className="border-b border-[--ucsi-border]">
            <th
              scope="col"
              className="sticky left-0 z-10 w-[200px] pb-2 pr-4 text-left text-xs font-medium text-[--text-secondary]"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              Name
            </th>
            <th
              scope="col"
              className="hidden pb-2 pr-4 text-left text-xs font-medium text-[--text-secondary] sm:table-cell"
            >
              Student No.
            </th>
            <th
              scope="col"
              className="hidden pb-2 pr-4 text-left text-xs font-medium text-[--text-secondary] sm:table-cell"
            >
              Programme
            </th>
            <th
              scope="col"
              className="pb-2 pr-4 text-left text-xs font-medium text-[--text-secondary]"
            >
              Status
            </th>
            <th
              scope="col"
              className="pb-2 text-right text-xs font-medium text-[--text-secondary]"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[--ucsi-border]">
          {rows.map((u) => (
            <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-white/5">
              <td
                className="sticky left-0 z-10 w-[200px] max-w-[200px] py-3 pr-4"
                style={{ backgroundColor: 'var(--bg-surface)' }}
              >
                <p className="truncate font-medium text-[--text-primary]">
                  {u.fullName ?? u.emailInstitutional}
                </p>
                <p className="truncate text-xs text-[--text-secondary]">
                  {u.emailInstitutional}
                </p>
              </td>
              <td className="hidden py-3 pr-4 font-mono text-xs text-[--text-secondary] sm:table-cell">
                {u.studentNumber ?? '—'}
              </td>
              <td className="hidden py-3 pr-4 sm:table-cell">
                {u.programmeCode ? (
                  <Badge variant="ucsi">{u.programmeCode}</Badge>
                ) : (
                  <span className="text-xs text-[--text-muted]">—</span>
                )}
              </td>
              <td className="py-3 pr-4">
                <Badge
                  variant={u.isActive ? 'success' : 'danger'}
                  aria-label={`Status: ${u.isActive ? 'Active' : 'Inactive'}`}
                >
                  {u.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="py-3 text-right">
                <ActionButtons
                  user={u}
                  currentAdminId={currentAdminId}
                  onEdit={onEdit}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Staff table (lecturers + admins) ─────────────────────────────────────────

function StaffTable({
  rows,
  currentAdminId,
  onEdit,
}: {
  rows: UserPageRow[]
  currentAdminId: string
  onEdit: (u: UserPageRow) => void
}) {
  if (rows.length === 0) return <EmptyState />
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[36rem] w-full text-sm" aria-label="Lecturers">
        <thead>
          <tr className="border-b border-[--ucsi-border]">
            <th
              scope="col"
              className="sticky left-0 z-10 w-[200px] pb-2 pr-4 text-left text-xs font-medium text-[--text-secondary]"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              Name
            </th>
            <th
              scope="col"
              className="hidden pb-2 pr-4 text-left text-xs font-medium text-[--text-secondary] sm:table-cell"
            >
              Staff ID
            </th>
            <th
              scope="col"
              className="hidden pb-2 pr-4 text-left text-xs font-medium text-[--text-secondary] sm:table-cell"
            >
              Department
            </th>
            <th
              scope="col"
              className="hidden pb-2 pr-4 text-left text-xs font-medium text-[--text-secondary] sm:table-cell"
            >
              Sections
            </th>
            <th
              scope="col"
              className="pb-2 pr-4 text-left text-xs font-medium text-[--text-secondary]"
            >
              Status
            </th>
            <th
              scope="col"
              className="pb-2 text-right text-xs font-medium text-[--text-secondary]"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[--ucsi-border]">
          {rows.map((u) => (
            <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-white/5">
              <td
                className="sticky left-0 z-10 w-[200px] max-w-[200px] py-3 pr-4"
                style={{ backgroundColor: 'var(--bg-surface)' }}
              >
                <p className="truncate font-medium text-[--text-primary]">
                  {u.fullName ?? u.emailInstitutional}
                </p>
                <p className="truncate text-xs text-[--text-secondary]">
                  {u.emailInstitutional}
                </p>
              </td>
              <td className="hidden py-3 pr-4 font-mono text-xs text-[--text-secondary] sm:table-cell">
                {u.staffNumber ?? '—'}
              </td>
              <td className="hidden py-3 pr-4 text-xs text-[--text-secondary] sm:table-cell">
                {u.department ?? '—'}
              </td>
              <td className="hidden py-3 pr-4 text-xs text-[--text-secondary] sm:table-cell">
                {u.sectionCodes.join(', ') || '—'}
              </td>
              <td className="py-3 pr-4">
                <Badge
                  variant={u.isActive ? 'success' : 'danger'}
                  aria-label={`Status: ${u.isActive ? 'Active' : 'Inactive'}`}
                >
                  {u.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="py-3 text-right">
                <ActionButtons
                  user={u}
                  currentAdminId={currentAdminId}
                  onEdit={onEdit}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function ActionButtons({
  user,
  currentAdminId,
  onEdit,
}: {
  user: UserPageRow
  currentAdminId: string
  onEdit: (u: UserPageRow) => void
}) {
  const isSelf = user.id === currentAdminId
  const name = user.fullName ?? user.emailInstitutional
  return (
    <span className="flex items-center justify-end gap-3 whitespace-nowrap">
      <button
        type="button"
        aria-label={`View ${name}`}
        className="text-xs font-medium hover:underline"
        style={{ color: 'var(--ucsi-red)' }}
      >
        View
      </button>
      <span className="text-[--text-muted]" aria-hidden="true">
        ·
      </span>
      <button
        type="button"
        aria-label={`Edit ${name}`}
        disabled={isSelf}
        title={isSelf ? 'You cannot edit your own account' : undefined}
        onClick={isSelf ? undefined : () => onEdit(user)}
        className={
          isSelf
            ? 'cursor-not-allowed text-xs font-medium opacity-40'
            : 'cursor-pointer text-xs font-medium hover:underline'
        }
        style={{ color: 'var(--ucsi-red)' }}
      >
        Edit
      </button>
    </span>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <Search size={20} className="mb-2 text-[--text-muted]" aria-hidden="true" />
      <p className="text-sm text-[--text-secondary]">No users match your search.</p>
    </div>
  )
}
