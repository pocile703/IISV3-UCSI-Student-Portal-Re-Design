import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { BookOpen, Users, FileText, AlertTriangle } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { LecturerQuickActions } from '@/components/lecturer/LecturerQuickActions'
import { LecturerSectionRow } from '@/components/lecturer/LecturerSectionRow'
import { LecturerActivityFeed } from '@/components/lecturer/LecturerActivityFeed'
import { LecturerPendingTasks } from '@/components/lecturer/LecturerPendingTasks'
import { prisma } from '@/lib/prisma'
import { getLecturerTasks } from '@/services/lecturer-tasks-queries'
import { createTask, toggleTask, deleteTask } from './actions'
import type { ActivityItem } from '@/components/lecturer/LecturerActivityFeed'
import type { PostType } from '@/types/post'

export default async function LecturerDashboardPage() {
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
              classPosts: { where: { type: 'URGENT', isPublished: true } },
            },
          },
        },
      },
    },
  })

  // Aggregate stat card values from DB counts.
  let totalStudents = 0
  let totalResources = 0
  let totalUrgentPosts = 0
  for (const { courseSection: cs } of assignments) {
    totalStudents  += cs._count.studentEnrollments
    totalResources += cs._count.learningResources
    totalUrgentPosts += cs._count.classPosts
  }

  const semesterName = assignments[0]?.courseSection.semester.name ?? 'Current Semester'
  const lecturerName = session.user.name ?? 'Lecturer'

  const sectionIds = assignments.map(a => a.courseSection.id)

  // Fetch tasks + recent activity in parallel (tasks independent; activity needs sectionIds from assignments).
  const [tasks, recentResources, recentPosts] = await Promise.all([
    getLecturerTasks(lecturerId),
    sectionIds.length === 0
      ? Promise.resolve([] as { id: string; title: string; createdAt: Date; courseSection: { course: { code: string } } }[])
      : prisma.learningResource.findMany({
          where: { courseSectionId: { in: sectionIds } },
          select: {
            id: true,
            title: true,
            createdAt: true,
            courseSection: { select: { course: { select: { code: true } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: 6,
        }),
    sectionIds.length === 0
      ? Promise.resolve([] as { id: string; title: string; type: string; createdAt: Date; courseSection: { course: { code: string } } | null }[])
      : prisma.classPost.findMany({
          where: { courseSectionId: { in: sectionIds } },
          select: {
            id: true,
            title: true,
            type: true,
            createdAt: true,
            courseSection: { select: { course: { select: { code: true } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: 6,
        }),
  ])

  const taskSnapshotKey = tasks.map((t) => `${t.id}:${t.isDone ? '1' : '0'}`).join('|')
  const pendingCount = tasks.filter((t) => !t.isDone).length

  const activityFeed: ActivityItem[] = [
    ...recentResources.map(r => ({
      kind: 'resource' as const,
      id: r.id,
      title: r.title,
      courseCode: r.courseSection.course.code,
      createdAt: r.createdAt.toISOString(),
    })),
    ...recentPosts.map(p => ({
      kind: 'post' as const,
      id: p.id,
      title: p.title,
      courseCode: p.courseSection!.course.code,
      createdAt: p.createdAt.toISOString(),
      postType: p.type.toLowerCase() as PostType,
    })),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6)

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[--text-primary]">
          Good morning, {lecturerName}
        </h1>
        <p className="mt-0.5 text-sm text-[--text-secondary]">
          {semesterName} · {assignments.length} section{assignments.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Quick actions */}
      <section aria-label="Quick access">
        <LecturerQuickActions />
      </section>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Sections"
          value={String(assignments.length)}
          sub={semesterName}
          icon={BookOpen}
        />
        <StatCard
          label="Students"
          value={String(totalStudents)}
          sub="Across all sections"
          icon={Users}
        />
        <StatCard
          label="Resources"
          value={String(totalResources)}
          sub="Published"
          icon={FileText}
        />
        <StatCard
          label="Urgent Posts"
          value={String(totalUrgentPosts)}
          sub="High importance"
          icon={AlertTriangle}
          accent={totalUrgentPosts > 0}
        />
      </div>

      {/* My Sections (left) + Pending Tasks + Recent Activity (right) */}
      <div className="grid gap-4 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_360px]">
        {/* My Sections — real UUIDs so "Open →" links route correctly */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-[--text-primary]">My Sections</h2>
            <p className="text-xs text-[--text-secondary]">{semesterName}</p>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <p className="py-6 text-center text-sm text-[--text-muted]">No sections assigned.</p>
            ) : (
              <div className="flex flex-col divide-y divide-[--ucsi-border]">
                {assignments.map(({ courseSection: cs }) => {
                  // dayOfWeek: DB 0=Mon → +1 → UI 1=Mon (LecturerSectionRow uses DAY_LABELS[dayOfWeek - 1])
                  const dayOfWeek = cs.dayOfWeek + 1
                  const timeStart = cs.timeStart instanceof Date
                    ? cs.timeStart.toISOString().slice(11, 16)
                    : String(cs.timeStart).slice(0, 5)
                  const timeEnd = cs.timeEnd instanceof Date
                    ? cs.timeEnd.toISOString().slice(11, 16)
                    : String(cs.timeEnd).slice(0, 5)

                  return (
                    <LecturerSectionRow
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
                      studentCount={cs._count.studentEnrollments}
                      resourceCount={cs._count.learningResources}
                      urgentPostCount={cs._count.classPosts}
                    />
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right panel: tasks + activity stacked */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-[--text-primary]">Pending Tasks</h2>
              <p className="text-xs text-[--text-secondary]">
                {pendingCount > 0 ? `${pendingCount} pending` : 'All done'}
              </p>
            </CardHeader>
            <CardContent>
              <LecturerPendingTasks
                key={taskSnapshotKey}
                tasks={tasks}
                createAction={createTask}
                toggleAction={toggleTask}
                deleteAction={deleteTask}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-[--text-primary]">Recent Activity</h2>
            </CardHeader>
            <CardContent>
              <LecturerActivityFeed items={activityFeed} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
