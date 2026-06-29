import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { prisma } from '@/lib/prisma'
import { generateSessionDates } from '@/lib/attendance'

export default async function LecturerAttendancePage() {
  const session = await auth()
  const lecturerId = session?.user?.lecturerId
  if (!lecturerId || session.user.role !== 'lecturer') redirect('/login')

  const assignments = await prisma.teachingAssignment.findMany({
    where: { lecturerId },
    orderBy: { courseSection: { course: { code: 'asc' } } },
    select: {
      courseSection: {
        select: {
          id: true,
          sectionCode: true,
          room: true,
          dayOfWeek: true,
          semester: { select: { name: true, startDate: true, endDate: true } },
          course: { select: { code: true, title: true } },
          _count: {
            select: { studentEnrollments: { where: { status: 'ENROLLED' } } },
          },
        },
      },
    },
  })

  if (assignments.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-[--text-primary]">Attendance</h1>
          <p className="mt-0.5 text-sm text-[--text-secondary]">No sections assigned this semester.</p>
        </div>
      </div>
    )
  }

  // Batch-fetch all distinct marked dates in one query rather than N section queries.
  const sectionIds = assignments.map(a => a.courseSection.id)
  const markedDateRows = await prisma.attendance.findMany({
    where: { courseSectionId: { in: sectionIds } },
    select: { courseSectionId: true, date: true },
    distinct: ['courseSectionId', 'date'],
  })
  // Store the actual date strings per section so we can intersect with sessionDates.
  // Counting all DB rows directly overstates the total when seed data contains dates
  // outside the weekly schedule (e.g. a Thursday record in a Monday-only section).
  const markedDatesBySection = new Map<string, Set<string>>()
  for (const row of markedDateRows) {
    const dateStr = (row.date as Date).toISOString().split('T')[0]
    if (!markedDatesBySection.has(row.courseSectionId)) {
      markedDatesBySection.set(row.courseSectionId, new Set())
    }
    markedDatesBySection.get(row.courseSectionId)!.add(dateStr)
  }

  const semesterName = assignments[0].courseSection.semester.name

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[--text-primary]">Attendance</h1>
        <p className="mt-0.5 text-sm text-[--text-secondary]">
          {semesterName} — select a section to manage attendance
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {assignments.map(({ courseSection: cs }) => {
          // DB dayOfWeek: 0=Mon…6=Sun → generateSessionDates ISO: 1=Mon…7=Sun
          const isoDow = cs.dayOfWeek + 1
          // @db.Date comes back as a Date object — strip to YYYY-MM-DD
          const startDate = cs.semester.startDate.toISOString().split('T')[0]
          const endDate = cs.semester.endDate.toISOString().split('T')[0]
          const sessionDates = generateSessionDates(isoDow, startDate, endDate)
          const totalSessions = sessionDates.length
          // Only count marked dates that are actual session dates — intersect to exclude
          // any DB records that fall outside the weekly schedule.
          const sessionDateSet = new Set(sessionDates)
          const sectionMarked = markedDatesBySection.get(cs.id) ?? new Set<string>()
          const markedSessions = [...sectionMarked].filter((d) => sessionDateSet.has(d)).length
          const pendingCount = totalSessions - markedSessions

          return (
            <Card key={cs.id} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--ucsi-red)' }}>
                    {cs.course.code}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-[--text-primary]">{cs.course.title}</p>
                  <p className="mt-0.5 text-xs text-[--text-secondary]">
                    Section {cs.sectionCode} · {cs.room ?? '—'}
                  </p>
                </div>
                {pendingCount > 0 && (
                  <Badge variant="warning" className="shrink-0">
                    {pendingCount} pending
                  </Badge>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-xs text-[--text-secondary]">
                <span className="flex items-center gap-1.5">
                  <Users size={13} aria-hidden="true" />
                  {cs._count.studentEnrollments} students
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} aria-hidden="true" />
                  {markedSessions} / {totalSessions} sessions marked
                </span>
              </div>

              <div className="mt-4">
                <Link
                  href={`/lecturer/attendance/${cs.id}`}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]"
                  style={{ backgroundColor: 'var(--ucsi-red)' }}
                >
                  Manage →
                </Link>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
