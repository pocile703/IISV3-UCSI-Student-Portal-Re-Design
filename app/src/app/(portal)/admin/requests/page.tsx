import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { AdminRequestsTable } from '@/components/admin/AdminRequestsTable'
import { getAdminRequestsData } from '@/services/requests-queries'

export default async function AdminRequestsPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/login')

  const { addDrop, progression } = await getAdminRequestsData()

  const all = [...addDrop, ...progression]
  const total = all.length
  const pending = all.filter((r) => r.status === 'pending').length
  const approved = all.filter((r) => r.status === 'approved').length
  const rejected = all.filter((r) => r.status === 'rejected').length

  // Remount the client table when server truth changes (status flips after a decision).
  const snapshotKey = `requests:${all.map((r) => `${r.id}:${r.status}`).join('|')}`

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[--text-primary]">Request Moderation</h1>
        <p className="mt-0.5 text-sm text-[--text-secondary]">Add/drop and progression requests</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-[--text-secondary]">Total</p>
            <p className="mt-1 text-2xl font-semibold text-[--text-primary]">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-[--text-secondary]">Pending</p>
            <p className="mt-1 text-2xl font-semibold text-[--text-primary]">{pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-[--text-secondary]">Approved</p>
            <p className="mt-1 text-2xl font-semibold text-[--text-primary]">{approved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-[--text-secondary]">Rejected</p>
            <p className="mt-1 text-2xl font-semibold text-[--text-primary]">{rejected}</p>
          </CardContent>
        </Card>
      </div>

      <AdminRequestsTable key={snapshotKey} initialAddDrop={addDrop} initialProgression={progression} />
    </div>
  )
}
