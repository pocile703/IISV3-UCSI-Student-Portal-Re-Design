import { prisma } from '@/lib/prisma'
import type { PostsPageRow } from '@/types/admin-posts'

export async function getAdminPostsData(): Promise<PostsPageRow[]> {
  const rows = await prisma.classPost.findMany({
    select: {
      id: true,
      title: true,
      body: true,
      type: true,
      isPinned: true,
      isPublished: true,
      createdAt: true,
      courseSectionId: true,
      courseSection: {
        select: { sectionCode: true, course: { select: { code: true } } },
      },
      author: {
        select: { lecturer: { select: { fullName: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return rows.map((p) => ({
    id: p.id,
    title: p.title,
    body: p.body,
    type: p.type.toLowerCase() as PostsPageRow['type'],
    isPinned: p.isPinned,
    isPublished: p.isPublished,
    createdAt: p.createdAt.toISOString(),
    courseSectionId: p.courseSectionId,
    sectionLabel: p.courseSection
      ? `${p.courseSection.course.code} · Sec ${p.courseSection.sectionCode}`
      : 'Global announcement',
    authorName: p.author.lecturer?.fullName ?? 'Staff',
  }))
}
