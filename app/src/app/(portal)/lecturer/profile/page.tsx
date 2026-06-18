import { User, Phone, BookOpen, Mail } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { mockCourseSections, mockCourses } from '@/data/mock-courses'
import { MOCK_LECTURER_PROFILE, MOCK_LECTURER_SECTION_IDS, MOCK_LECTURER_STUDENT_COUNTS } from '@/data/mock-lecturer'
import { formatDate, DAY_LABELS } from '@/lib/utils'
import { ThecnEditForm } from '@/components/profile/ThecnEditForm'
import { updateLecturerThecnUsername } from './actions'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[--text-secondary]">{label}</p>
      <p className="mt-0.5 text-sm text-[--text-primary]">{value || '—'}</p>
    </div>
  )
}

const assignedSections = mockCourseSections.filter((s) =>
  MOCK_LECTURER_SECTION_IDS.includes(s.id),
)

export default async function LecturerProfilePage() {
  const session = await auth()
  const lecturerId = session?.user?.lecturerId
  if (!lecturerId || session.user.role !== 'lecturer') redirect('/login')

  // Fetch only thecnUsername from DB; rest of the page still uses mock data (Phase 6).
  const lecturerDb = await prisma.lecturer.findUnique({
    where: { id: lecturerId },
    select: { thecnUsername: true },
  })

  const { fullName, initials, staffId, designation, department, faculty,
          email, phone, office, dateJoined, qualification, specialisation } = MOCK_LECTURER_PROFILE

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
          <h1 className="text-xl font-semibold text-[--text-primary]">{fullName}</h1>
          <p className="text-sm text-[--text-secondary]">{staffId}</p>
          <Badge variant="ucsi" className="mt-1">{designation}</Badge>
        </div>
      </div>

      {/* Employment info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User size={15} className="text-[--text-secondary]" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-[--text-primary]">Employment Details</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Staff ID"      value={staffId} />
            <Field label="Date Joined"   value={formatDate(dateJoined)} />
            <Field label="Designation"   value={designation} />
            <Field label="Department"    value={department} />
            <Field label="Faculty"       value={faculty} />
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

      {/* Academic background */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User size={15} className="text-[--text-secondary]" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-[--text-primary]">Academic Background</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Highest Qualification" value={qualification} />
            <Field label="Specialisation"        value={specialisation} />
          </div>
        </CardContent>
      </Card>

      {/* Assigned sections */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen size={15} className="text-[--text-secondary]" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-[--text-primary]">Assigned Sections</h2>
            <span className="ml-auto text-xs text-[--text-secondary]">Semester 1 2023/24</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col divide-y divide-[--ucsi-border]">
            {assignedSections.map((sec) => {
              const course = mockCourses.find((c) => c.id === sec.courseId)
              if (!course) return null
              const day = DAY_LABELS[sec.dayOfWeek - 1]
              const students = MOCK_LECTURER_STUDENT_COUNTS[sec.id] ?? 0
              return (
                <div key={sec.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-sm font-bold" style={{ color: 'var(--ucsi-red)' }}>
                        {course.code}
                      </span>
                      <span className="text-sm text-[--text-primary]">{course.title}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-[--text-secondary]">
                      Sec {sec.sectionCode} · {sec.room ?? '—'} · {day} {sec.timeStart}–{sec.timeEnd}
                    </p>
                  </div>
                  <Badge variant="neutral">{students} students</Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* E-Portfolio */}
      <ThecnEditForm current={lecturerDb?.thecnUsername ?? undefined} action={updateLecturerThecnUsername} />

      <p className="flex flex-wrap items-center gap-1.5 text-xs text-[--text-secondary]">
        <Phone size={11} aria-hidden="true" />
        To update your staff information, contact the Registrar&apos;s Office at{' '}
        <a href="mailto:registrar@ucsicollege.edu.my" className="hover:underline" style={{ color: 'var(--ucsi-red)' }}>
          registrar@ucsicollege.edu.my
        </a>
      </p>
    </div>
  )
}
