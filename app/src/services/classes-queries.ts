// Server-only Prisma queries for the Classes (/classes) page.
import { prisma } from '@/lib/prisma'
import { SectionEnrollmentStatus } from '@prisma/client'
import type { ResourceType } from '@/types/resource'
import type { PostType } from '@/types/post'
import type {
  ClassesPageData,
  ClassesPost,
  ClassesResource,
  ClassesSectionData,
} from '@/types/classes'

// ── Enum mappers (DB uppercase → frontend lowercase union) ───────────────────

function toResourceType(dbType: string): ResourceType {
  return dbType.toLowerCase() as ResourceType
}

function toPostType(dbType: string): PostType {
  return dbType.toLowerCase() as PostType
}

// ── Main query ───────────────────────────────────────────────────────────────

export async function getClassesData(studentId: string): Promise<ClassesPageData> {
  // ── 1. Enrolled sections + global announcements in parallel ──────────────
  // Global posts (courseSectionId = null) are admin-authored announcements visible
  // to all enrolled students — no section ownership check required.
  const [enrollments, rawGlobalPosts] = await Promise.all([
  prisma.studentSectionEnrollment.findMany({
    where: {
      studentId,
      status: SectionEnrollmentStatus.ENROLLED,
      courseSection: { semester: { isCurrent: true } },
    },
    select: {
      courseSection: {
        select: {
          id: true,
          sectionCode: true,
          room: true,
          semester: { select: { name: true } },
          course:   { select: { code: true, title: true } },
          // Primary lecturer: earliest TeachingAssignment for this section.
          // `take: 1` + `orderBy assignedAt asc` → deterministic for co-assigned sections.
          teachingAssignments: {
            select: { lecturer: { select: { fullName: true } } },
            orderBy: { assignedAt: 'asc' },
            take: 1,
          },
          // Published resources only — matches @@index([courseSectionId, isPublished]).
          learningResources: {
            where: { isPublished: true },
            select: {
              id: true,
              title: true,
              description: true,
              type: true,
              createdAt: true,
              // First attachment only — ClassSectionCard uses the singular `attachment?` shape.
              // storageKey is intentionally excluded (internal S3/R2 path, not for clients).
              attachments: {
                select: {
                  id: true,
                  originalFilename: true,
                  fileSizeBytes: true,
                  downloadCount: true,
                },
                take: 1,
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          // Published section-scoped posts — matches @@index([courseSectionId, isPublished]).
          classPosts: {
            where: { isPublished: true },
            select: {
              id: true,
              title: true,
              body: true,
              type: true,
              isPinned: true,
              createdAt: true,
              author: {
                select: {
                  lecturer: { select: { fullName: true } },
                },
              },
            },
          },
        },
      },
    },
  }),
  prisma.classPost.findMany({
    where: { courseSectionId: null, isPublished: true },
    select: {
      id: true,
      title: true,
      body: true,
      type: true,
      isPinned: true,
      createdAt: true,
      author: { select: { lecturer: { select: { fullName: true } } } },
    },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
  }),
  ])

  const globalPosts: ClassesPost[] = rawGlobalPosts.map((p) => ({
    id: p.id,
    title: p.title,
    body: p.body,
    type: toPostType(p.type),
    isPinned: p.isPinned,
    createdAt: p.createdAt.toISOString(),
    authorName: p.author.lecturer?.fullName ?? 'Admin',
  }))

  if (enrollments.length === 0) {
    return { semesterName: '', globalPosts, sections: [] }
  }

  const semesterName = enrollments[0].courseSection.semester.name

  // ── 2. Map to ClassesSectionData ─────────────────────────────────────────
  const sections: ClassesSectionData[] = enrollments.map((e) => {
    const cs = e.courseSection

    // Primary lecturer name — falls back to 'TBA' when no assignment exists.
    const lecturerName = cs.teachingAssignments[0]?.lecturer?.fullName ?? 'TBA'

    // Map resources: BigInt fileSizeBytes → number; enum values → lowercase.
    const resources: ClassesResource[] = cs.learningResources.map((r) => {
      const att = r.attachments[0]
      return {
        id: r.id,
        title: r.title,
        description: r.description ?? undefined,
        type: toResourceType(r.type),
        createdAt: r.createdAt.toISOString(),
        attachment: att
          ? {
              id: att.id,
              originalFilename: att.originalFilename,
              // ResourceAttachment.fileSizeBytes is BigInt in the DB — Number() is safe
              // for file sizes (well under Number.MAX_SAFE_INTEGER at ~8 PB).
              fileSizeBytes: Number(att.fileSizeBytes),
              downloadCount: att.downloadCount,
            }
          : undefined,
      }
    })

    // Sort posts: pinned first, then by createdAt descending.
    const posts: ClassesPost[] = cs.classPosts
      .map((p) => ({
        id: p.id,
        title: p.title,
        body: p.body,
        type: toPostType(p.type),
        isPinned: p.isPinned,
        createdAt: p.createdAt.toISOString(),
        authorName: p.author.lecturer?.fullName ?? 'Staff',
      }))
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

    return {
      sectionId: cs.id,
      sectionCode: cs.sectionCode,
      room: cs.room ?? '—',
      courseCode: cs.course.code,
      courseTitle: cs.course.title,
      lecturerName,
      resources,
      posts,
    }
  })

  return { semesterName, globalPosts, sections }
}
