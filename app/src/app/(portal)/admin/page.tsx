import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { GraduationCap, UserCog, BookOpen, LayoutGrid } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { AdminQuickActions } from '@/components/admin/AdminQuickActions'
import { LecturerAssignmentsCard } from '@/components/admin/LecturerAssignmentsCard'
import { AdminActivityFeed } from '@/components/admin/AdminActivityFeed'
import { AdminRecentPosts, type AdminRecentPost } from '@/components/admin/AdminRecentPosts'
import { AdminResourceModeration, type AdminModerationResource } from '@/components/admin/AdminResourceModeration'
import { MOCK_ADMIN_STATS, MOCK_ADMIN_PROFILE } from '@/data/mock-admin'
import { prisma } from '@/lib/prisma'
import type { PostType } from '@/types/post'

export default async function AdminDashboardPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/login')

  const [rawPosts, rawResources] = await Promise.all([
    prisma.classPost.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        type: true,
        isPinned: true,
        isPublished: true,
        createdAt: true,
        courseSection: {
          select: { sectionCode: true, course: { select: { code: true } } },
        },
        author: {
          select: { lecturer: { select: { fullName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
    prisma.learningResource.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        type: true,
        createdAt: true,
        courseSection: {
          select: { sectionCode: true, course: { select: { code: true } } },
        },
        lecturer: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
  ])

  const posts: AdminRecentPost[] = rawPosts.map((p) => ({
    id: p.id,
    title: p.title,
    type: p.type.toLowerCase() as PostType,
    isPinned: p.isPinned,
    isPublished: p.isPublished,
    createdAt: p.createdAt.toISOString(),
    sectionLabel: p.courseSection
      ? `${p.courseSection.course.code} · Sec ${p.courseSection.sectionCode}`
      : 'Global announcement',
    authorName: p.author.lecturer?.fullName ?? 'Staff',
  }))

  const moderationResources: AdminModerationResource[] = rawResources.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type.toLowerCase(),
    createdAt: r.createdAt.toISOString(),
    sectionLabel: `${r.courseSection.course.code} · Sec ${r.courseSection.sectionCode}`,
    uploaderName: r.lecturer.fullName,
  }))

  // Snapshot keys: force client component remount when server data changes after a mutation.
  const postSnapshotKey    = `posts:${posts.map((p) => `${p.id}:${p.isPublished ? 1 : 0}`).join('|')}`
  const resourceSnapshotKey = `resources:${moderationResources.map((r) => r.id).join('|')}`

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[--text-primary]">
          Good morning, {MOCK_ADMIN_PROFILE.name}
        </h1>
        <p className="mt-0.5 text-sm text-[--text-secondary]">
          Semester 1 2023/24 · Administrator
        </p>
      </div>

      {/* Quick actions */}
      <section aria-label="Quick access">
        <AdminQuickActions />
      </section>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Students"
          value={String(MOCK_ADMIN_STATS.totalStudents)}
          sub="Enrolled this semester"
          icon={GraduationCap}
          accent
        />
        <StatCard
          label="Lecturers"
          value={String(MOCK_ADMIN_STATS.totalLecturers)}
          sub="Active staff"
          icon={UserCog}
          accent
        />
        <StatCard
          label="Programmes"
          value={String(MOCK_ADMIN_STATS.totalProgrammes)}
          sub="Active programmes"
          icon={BookOpen}
          accent
        />
        <StatCard
          label="Sections"
          value={String(MOCK_ADMIN_STATS.totalSections)}
          sub="Active this semester"
          icon={LayoutGrid}
          accent
        />
      </div>

      {/* Row 1: Lecturer Assignments (left) + System Activity (right) */}
      <div className="grid gap-4 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_360px]">
        <LecturerAssignmentsCard />
        <AdminActivityFeed />
      </div>

      {/* Row 2: Recent Posts (left) + Resource Moderation (right) */}
      <div className="grid gap-4 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_360px]">
        <AdminRecentPosts key={postSnapshotKey} initialPosts={posts} />
        <AdminResourceModeration key={resourceSnapshotKey} initialResources={moderationResources} />
      </div>

    </div>
  )
}
