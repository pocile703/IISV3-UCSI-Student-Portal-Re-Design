'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import {
  approveAddDropRequest,
  rejectAddDropRequest,
  approveProgressionRequest,
  rejectProgressionRequest,
} from '@/app/(portal)/admin/requests/actions'
import type {
  AdminAddDropRow,
  AdminProgressionRow,
  RequestStatus,
} from '@/types/requests'

type ActionResult = { error?: string; success?: boolean }
type DecideFn = (id: string) => Promise<ActionResult>

const STATUS_VARIANT: Record<RequestStatus, 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
}
const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

const STATUS_CHIPS: { value: RequestStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

// ─── Shared decision cell ────────────────────────────────────────────────────
// Pending rows get Approve / Reject buttons; decided rows show their status badge.

function DecisionCell({
  id,
  status,
  approve,
  reject,
  onDecided,
}: {
  id: string
  status: RequestStatus
  approve: DecideFn
  reject: DecideFn
  onDecided: (id: string, status: RequestStatus) => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function run(fn: DecideFn, next: RequestStatus) {
    startTransition(async () => {
      const result = await fn(id)
      if (result?.error) { setError(result.error); return }
      onDecided(id, next)
      router.refresh()
    })
  }

  if (status !== 'pending') {
    return (
      <Badge variant={STATUS_VARIANT[status]} aria-label={`Status: ${STATUS_LABEL[status]}`}>
        {STATUS_LABEL[status]}
      </Badge>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <span className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => run(approve, 'approved')}
          disabled={pending}
          className="inline-flex cursor-pointer items-center rounded-md border border-green-600/40 px-3 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-600/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 disabled:cursor-wait disabled:opacity-50 dark:text-green-400"
        >
          {pending ? '…' : 'Approve'}
        </button>
        <button
          type="button"
          onClick={() => run(reject, 'rejected')}
          disabled={pending}
          className="inline-flex cursor-pointer items-center rounded-md border border-[#C1272D]/30 px-3 py-1 text-xs font-medium text-[#C1272D] transition-colors hover:bg-[--ucsi-red]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red] disabled:cursor-wait disabled:opacity-50"
        >
          {pending ? '…' : 'Reject'}
        </button>
      </span>
      {error && <p className="text-[10px] text-red-500">{error}</p>}
    </div>
  )
}

function StatusChips({
  active,
  onSelect,
}: {
  active: RequestStatus | 'all'
  onSelect: (v: RequestStatus | 'all') => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_CHIPS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onSelect(opt.value)}
          className={
            active === opt.value
              ? 'rounded-full px-3 py-1 text-xs font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]'
              : 'rounded-full border border-[--ucsi-border] px-3 py-1 text-xs font-medium text-[--text-secondary] transition-colors hover:bg-[--ucsi-red]/15 hover:text-[#C1272D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]'
          }
          style={active === opt.value ? { backgroundColor: 'var(--ucsi-red)' } : undefined}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── Main table ────────────────────────────────────────────────────────────

export function AdminRequestsTable({
  initialAddDrop,
  initialProgression,
}: {
  initialAddDrop: AdminAddDropRow[]
  initialProgression: AdminProgressionRow[]
}) {
  const [addDrop, setAddDrop] = useState(initialAddDrop)
  const [progression, setProgression] = useState(initialProgression)
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('pending')

  const filteredAddDrop = useMemo(
    () => addDrop.filter((r) => statusFilter === 'all' || r.status === statusFilter),
    [addDrop, statusFilter],
  )
  const filteredProgression = useMemo(
    () => progression.filter((r) => statusFilter === 'all' || r.status === statusFilter),
    [progression, statusFilter],
  )

  function patchAddDrop(id: string, status: RequestStatus) {
    setAddDrop((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }
  function patchProgression(id: string, status: RequestStatus) {
    setProgression((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  return (
    <div className="flex flex-col gap-5">
      <StatusChips active={statusFilter} onSelect={setStatusFilter} />

      {/* Add / Drop */}
      <section aria-label="Add and drop requests" className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-[--text-primary]">Add / Drop Requests</h2>
        <Card>
          <CardContent className="p-0">
            {filteredAddDrop.length === 0 ? (
              <div className="py-12 text-center text-sm text-[--text-muted]">No add/drop requests match this filter.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[48rem] w-full text-sm" aria-label="Add and drop requests">
                  <thead>
                    <tr className="border-b border-[--ucsi-border]">
                      <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-[--text-secondary]">Student</th>
                      <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-[--text-secondary]">Action</th>
                      <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-[--text-secondary]">Class</th>
                      <th scope="col" className="hidden px-5 py-3 text-left text-xs font-medium text-[--text-secondary] lg:table-cell">Requested</th>
                      <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-[--text-secondary]">Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAddDrop.map((r) => (
                      <tr key={r.id} className="border-b border-[--ucsi-border] last:border-0 hover:bg-zinc-50 dark:hover:bg-white/5">
                        <td className="px-5 py-3">
                          <p className="font-medium text-[--text-primary]">{r.studentName}</p>
                          <p className="text-xs text-[--text-secondary]">{r.studentNumber}</p>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={r.action === 'add' ? 'info' : 'neutral'}>{r.action === 'add' ? 'Add' : 'Drop'}</Badge>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-[--text-primary]">{r.sectionLabel}</p>
                          {r.reason && <p className="mt-0.5 line-clamp-1 text-xs text-[--text-secondary]">{r.reason}</p>}
                        </td>
                        <td className="hidden px-5 py-3 text-xs text-[--text-secondary] lg:table-cell">{formatDate(r.createdAt)}</td>
                        <td className="px-5 py-3 text-right">
                          <DecisionCell
                            id={r.id}
                            status={r.status}
                            approve={approveAddDropRequest}
                            reject={rejectAddDropRequest}
                            onDecided={patchAddDrop}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Progression */}
      <section aria-label="Progression requests" className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-[--text-primary]">Progression Requests</h2>
        <Card>
          <CardContent className="p-0">
            {filteredProgression.length === 0 ? (
              <div className="py-12 text-center text-sm text-[--text-muted]">No progression requests match this filter.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[48rem] w-full text-sm" aria-label="Progression requests">
                  <thead>
                    <tr className="border-b border-[--ucsi-border]">
                      <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-[--text-secondary]">Student</th>
                      <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-[--text-secondary]">From → To</th>
                      <th scope="col" className="hidden px-5 py-3 text-left text-xs font-medium text-[--text-secondary] md:table-cell">Reason</th>
                      <th scope="col" className="hidden px-5 py-3 text-left text-xs font-medium text-[--text-secondary] lg:table-cell">Requested</th>
                      <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-[--text-secondary]">Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProgression.map((r) => (
                      <tr key={r.id} className="border-b border-[--ucsi-border] last:border-0 hover:bg-zinc-50 dark:hover:bg-white/5">
                        <td className="px-5 py-3">
                          <p className="font-medium text-[--text-primary]">{r.studentName}</p>
                          <p className="text-xs text-[--text-secondary]">{r.studentNumber}</p>
                        </td>
                        <td className="px-5 py-3 text-[--text-primary]">{r.fromSemester} → {r.toSemester}</td>
                        <td className="hidden px-5 py-3 text-xs text-[--text-secondary] md:table-cell"><span className="line-clamp-2">{r.reason}</span></td>
                        <td className="hidden px-5 py-3 text-xs text-[--text-secondary] lg:table-cell">{formatDate(r.createdAt)}</td>
                        <td className="px-5 py-3 text-right">
                          <DecisionCell
                            id={r.id}
                            status={r.status}
                            approve={approveProgressionRequest}
                            reject={rejectProgressionRequest}
                            onDecided={patchProgression}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
