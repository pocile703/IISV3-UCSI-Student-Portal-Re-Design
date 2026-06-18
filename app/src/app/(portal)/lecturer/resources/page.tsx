import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SectionPickerCard } from '@/components/lecturer/SectionPickerCard'

export default async function LecturerResourcesPage() {
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
          semesterId: true,
          sectionCode: true,
          room: true,
          dayOfWeek: true,
          timeStart: true,
          timeEnd: true,
          semester: { select: { name: true } },
          course: {
            select: { id: true, code: true, title: true, credits: true, type: true },
          },
          _count: {
            select: {
              studentEnrollments: { where: { status: 'ENROLLED' } },
              learningResources: true,
              classPosts: { where: { isPublished: true } },
            },
          },
          // Separate select for urgent badge count — avoids a second query.
          classPosts: {
            where: { type: 'URGENT', isPublished: true },
            select: { id: true },
          },
          // Latest resource createdAt for the "last activity" display.
          learningResources: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true },
          },
        },
      },
    },
  })

  const semesterName = assignments[0]?.courseSection.semester.name ?? 'Current Semester'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[--text-primary]">My Classes</h1>
        <p className="mt-0.5 text-sm text-[--text-secondary]">{semesterName}</p>
      </div>

      {assignments.length === 0 ? (
        <p className="py-8 text-center text-sm text-[--text-muted]">
          No sections assigned this semester.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {assignments.map(({ courseSection: cs }) => {
            // dayOfWeek: DB 0 = Monday … 6 = Sunday.
            // SectionPickerCard uses DAY_LABELS[dayOfWeek - 1] (1-indexed) — add 1 when mapping.
            const dayOfWeek = cs.dayOfWeek + 1

            // @db.Time columns come back as Date objects at epoch (1970-01-01).
            // Format as HH:MM for the picker card.
            const timeStart = cs.timeStart instanceof Date
              ? cs.timeStart.toISOString().slice(11, 16)
              : String(cs.timeStart).slice(0, 5)
            const timeEnd = cs.timeEnd instanceof Date
              ? cs.timeEnd.toISOString().slice(11, 16)
              : String(cs.timeEnd).slice(0, 5)

            const lastActivity =
              cs.learningResources[0]?.createdAt.toISOString() ??
              new Date().toISOString()

            return (
              <SectionPickerCard
                key={cs.id}
                section={{
                  id: cs.id,
                  courseId: cs.course.id,
                  semesterId: cs.semesterId,
                  sectionCode: cs.sectionCode,
                  room: cs.room ?? undefined,
                  dayOfWeek,
                  timeStart,
                  timeEnd,
                }}
                course={{
                  id: cs.course.id,
                  code: cs.course.code,
                  title: cs.course.title,
                  credits: Number(cs.course.credits),
                  type: cs.course.type.toLowerCase() as 'core' | 'elective' | 'mpw' | 'bridging',
                }}
                resourceCount={cs._count.learningResources}
                postCount={cs._count.classPosts}
                urgentCount={cs.classPosts.length}
                studentCount={cs._count.studentEnrollments}
                lastActivity={lastActivity}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
