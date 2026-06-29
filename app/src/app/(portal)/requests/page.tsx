import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StudentRequestForms } from '@/components/requests/StudentRequestForms'
import { getStudentRequestsData } from '@/services/requests-queries'
import { formatDate } from '@/lib/utils'
import type { RequestStatus } from '@/types/requests'

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

export default async function RequestsPage() {
  const session = await auth()
  const studentId = session?.user?.studentId
  if (!studentId || session.user.role !== 'student') redirect('/login')

  const { requests, options } = await getStudentRequestsData(studentId)
  const hasHistory = requests.addDrop.length > 0 || requests.progression.length > 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[--text-primary]">Requests</h1>
        <p className="mt-0.5 text-sm text-[--text-secondary]">
          Submit add/drop and semester progression requests, and track their status
        </p>
      </div>

      <StudentRequestForms
        addableSections={options.addableSections}
        droppableSections={options.droppableSections}
        currentSemesterId={options.currentSemesterId}
        currentSemesterName={options.currentSemesterName}
        progressionTargets={options.progressionTargets}
      />

      {/* History */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-[--text-primary]">My Requests</h2>
        </CardHeader>
        <CardContent>
          {!hasHistory ? (
            <p className="py-4 text-center text-sm text-[--text-muted]">You haven&apos;t submitted any requests yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[--ucsi-border]">
              {requests.addDrop.map((r) => (
                <div key={r.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[--text-primary]">
                        <span className="uppercase">{r.action}</span> · {r.sectionLabel}
                      </p>
                      {r.reason && <p className="mt-1 text-xs text-[--text-secondary] line-clamp-2">{r.reason}</p>}
                    </div>
                    <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-[--text-secondary]">
                    <span>Requested {formatDate(r.createdAt)}</span>
                    {r.reviewedAt && <span>Reviewed {formatDate(r.reviewedAt)}</span>}
                  </div>
                </div>
              ))}
              {requests.progression.map((r) => (
                <div key={r.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[--text-primary]">
                        Progression · {r.fromSemester} → {r.toSemester}
                      </p>
                      <p className="mt-1 text-xs text-[--text-secondary] line-clamp-2">{r.reason}</p>
                    </div>
                    <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-[--text-secondary]">
                    <span>Requested {formatDate(r.createdAt)}</span>
                    {r.reviewedAt && <span>Reviewed {formatDate(r.reviewedAt)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
