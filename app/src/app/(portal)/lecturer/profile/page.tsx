import { User, Phone, BookOpen, Mail } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { DAY_LABELS } from '@/lib/utils'
import { ThecnEditForm } from '@/components/profile/ThecnEditForm'
import { updateLecturerThecnUsername } from './actions'
import { getLecturerTimetableData } from '@/services/lecturer-timetable-queries'
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

// "Sarah Tan" → "ST"; falls back to the first two characters of a single word.
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '—'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default async function LecturerProfilePage() {
  const session = await auth()
  const lecturerId = session?.user?.lecturerId
  if (!lecturerId || session.user.role !== 'lecturer') redirect('/login')

  const lecturer = await prisma.lecturer.findUnique({
    where: { id: lecturerId },
    select: {
      fullName: true,
      staffNumber: true,
      department: true,
      thecnUsername: true,
      user: { select: { emailInstitutional: true } },
    },
  })

  // A missing profile row = broken session, not a 500.
  if (!lecturer) redirect('/login')

  // Assigned sections come from the shared timetable view-model so the dayOfWeek
  // convention (1=Mon, label via DAY_LABELS[dayOfWeek - 1]) matches the timetable page.
  const { semesterName: timetableSemester, sessions: assignedSections } =
    await getLecturerTimetableData(lecturerId)

  const { fullName, staffNumber, department, thecnUsername } = lecturer
  const email = lecturer.user.emailInstitutional
  const initials = initialsOf(fullName)
  const semesterName = timetableSemester || 'Current semester'

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
          <p className="text-sm text-[--text-secondary]">{staffNumber}</p>
          <Badge variant="ucsi" className="mt-1">{department}</Badge>
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
            <Field label="Staff Number" value={staffNumber} />
            <Field label="Department"   value={department} />
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
            <Field label="Institutional Email" value={email} />
          </div>
        </CardContent>
      </Card>

      {/* Assigned sections */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen size={15} className="text-[--text-secondary]" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-[--text-primary]">Assigned Sections</h2>
            <span className="ml-auto text-xs text-[--text-secondary]">{semesterName}</span>
          </div>
        </CardHeader>
        <CardContent>
          {assignedSections.length === 0 ? (
            <p className="py-6 text-center text-sm text-[--text-muted]">No sections assigned this semester.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[--ucsi-border]">
              {assignedSections.map((sec) => {
                const day = DAY_LABELS[sec.dayOfWeek - 1] // view-model 1=Mon → DAY_LABELS 0-indexed
                return (
                  <div key={sec.sectionId} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-sm font-bold" style={{ color: 'var(--ucsi-red)' }}>
                          {sec.courseCode}
                        </span>
                        <span className="text-sm text-[--text-primary]">{sec.courseTitle}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[--text-secondary]">
                        Sec {sec.sectionCode} · {sec.room} · {day} {sec.timeStart}–{sec.timeEnd}
                      </p>
                    </div>
                    <Badge variant="neutral">{sec.studentCount} students</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* E-Portfolio */}
      <ThecnEditForm current={thecnUsername ?? undefined} action={updateLecturerThecnUsername} />

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
