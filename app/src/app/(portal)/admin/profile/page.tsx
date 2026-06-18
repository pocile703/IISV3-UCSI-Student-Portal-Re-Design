import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { User, Mail, ShieldCheck } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MOCK_ADMIN_PROFILE } from '@/data/mock-admin'
import { formatDate } from '@/lib/utils'

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[--text-secondary]">{label}</p>
      <p className="mt-0.5 text-sm text-[--text-primary]">{value || '—'}</p>
    </div>
  )
}

const MANAGED_MODULES = [
  { label: 'User Management',    detail: 'Create, edit, and deactivate student and lecturer accounts' },
  { label: 'Programme Management', detail: 'Define programmes, manage enrolment caps and status' },
  { label: 'Section Management', detail: 'Create course sections, assign lecturers, enrol students' },
  { label: 'Resource Moderation', detail: 'Review and remove published learning resources system-wide' },
]

export default async function AdminProfilePage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/login')
  const { name, initials, staffId, designation, department, office, email, phone, dateJoined } =
    MOCK_ADMIN_PROFILE

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
          style={{ backgroundColor: 'var(--ucsi-red)' }}
        >
          {initials}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[--text-primary]">{name}</h1>
          <p className="text-sm text-[--text-secondary]">{staffId}</p>
          <Badge variant="ucsi" className="mt-1">{designation}</Badge>
        </div>
      </div>

      {/* Administration details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User size={15} className="text-[--text-secondary]" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-[--text-primary]">Administration Details</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Staff ID"      value={staffId} />
            <Field label="Date Joined"   value={formatDate(dateJoined)} />
            <Field label="Designation"   value={designation} />
            <Field label="Department"    value={department} />
            <Field label="Office"        value={office} />
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail size={15} className="text-[--text-secondary]" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-[--text-primary]">Contact Information</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Email"  value={email} />
            <Field label="Phone"  value={phone} />
            <Field label="Office" value={office} />
          </div>
        </CardContent>
      </Card>

      {/* System access */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-[--text-secondary]" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-[--text-primary]">System Access</h2>
            <span className="ml-auto">
              <Badge variant="success">Full Access</Badge>
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col divide-y divide-[--ucsi-border]">
            {MANAGED_MODULES.map((mod) => (
              <div key={mod.label} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <ShieldCheck
                  size={14}
                  className="mt-0.5 shrink-0"
                  style={{ color: 'var(--ucsi-red)' }}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium text-[--text-primary]">{mod.label}</p>
                  <p className="text-xs text-[--text-secondary]">{mod.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
