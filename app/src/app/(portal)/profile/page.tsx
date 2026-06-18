import { User, Phone, MapPin, Users } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { getProfileData } from '@/services/profile-queries'
import { formatDate } from '@/lib/utils'
import { ThecnEditForm } from '@/components/profile/ThecnEditForm'
import { updateStudentThecnUsername } from './actions'

import { auth } from '@/auth'
import { redirect } from 'next/navigation'

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[--text-secondary]">{label}</p>
      <p className="mt-0.5 text-sm text-[--text-primary]">{value || '—'}</p>
    </div>
  )
}

export default async function ProfilePage() {
  const session = await auth()
  const studentId = session?.user?.studentId
  if (!studentId) redirect('/login')
  const data = await getProfileData(studentId)
  const { fullName, studentNumber, dateOfBirth, gender, nationality, mobile,
          guardianName, guardianRelation, addressLine1, addressLine2, city, state, postcode, country } = data
  const enrollmentStatusLabel = data.enrollment
    ? data.enrollment.status.charAt(0).toUpperCase() + data.enrollment.status.slice(1)
    : 'Student'

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white" style={{ backgroundColor: 'var(--ucsi-red)' }}>
          {fullName.charAt(0)}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[--text-primary]">{fullName}</h1>
          <p className="text-sm text-[--text-secondary]">{studentNumber}</p>
          <Badge
            variant={data.enrollment?.status === 'active' ? 'success' : 'neutral'}
            className="mt-1"
          >
            {enrollmentStatusLabel}
          </Badge>
        </div>
      </div>

      {/* Enrolment */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User size={15} className="text-[--text-secondary]" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-[--text-primary]">Programme Enrolment</h2>
          </div>
        </CardHeader>
        <CardContent>
          {data.enrollment ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Programme" value={data.enrollment.programmeName} />
              <Field label="File Number" value={data.enrollment.fileNumber} />
              <Field label="Intake Date" value={formatDate(data.enrollment.intakeDate)} />
              <Field label="Expected Graduation" value={formatDate(data.enrollment.expectedGradDate)} />
              <Field label="Status" value={data.enrollment.status.charAt(0).toUpperCase() + data.enrollment.status.slice(1)} />
            </div>
          ) : (
            <p className="text-sm text-[--text-muted]">No programme enrolment on record.</p>
          )}
        </CardContent>
      </Card>

      {/* Personal info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User size={15} className="text-[--text-secondary]" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-[--text-primary]">Personal Information</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Full Name" value={fullName} />
            <Field label="Date of Birth" value={dateOfBirth ? formatDate(dateOfBirth) : undefined} />
            <Field label="Gender" value={gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : undefined} />
            <Field label="Nationality" value={nationality} />
            <Field label="Mobile" value={mobile} />
          </div>
        </CardContent>
      </Card>

      {/* Guardian */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users size={15} className="text-[--text-secondary]" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-[--text-primary]">Guardian / Parent</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={guardianName} />
            <Field label="Relationship" value={guardianRelation} />
            <Field label="Contact" value={undefined} />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-[--text-secondary]" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-[--text-primary]">Address</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Address" value={addressLine1} />
            {addressLine2 && <Field label="Address Line 2" value={addressLine2} />}
            <Field label="City" value={city} />
            <Field label="State" value={state} />
            <Field label="Postcode" value={postcode} />
            <Field label="Country" value={country} />
          </div>
        </CardContent>
      </Card>

      {/* E-Portfolio */}
      <ThecnEditForm current={data.thecnUsername} action={updateStudentThecnUsername} />

      <p className="flex flex-wrap items-center gap-1.5 text-xs text-[--text-secondary]">
        <Phone size={11} aria-hidden="true" />
        To update your personal information, contact the Registrar&apos;s Office at{' '}
        <a href="mailto:registrar@ucsicollege.edu.my" className="hover:underline" style={{ color: 'var(--ucsi-red)' }}>
          registrar@ucsicollege.edu.my
        </a>
      </p>
    </div>
  )
}
