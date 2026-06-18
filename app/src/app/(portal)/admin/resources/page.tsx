import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/Card'
import { AdminResourceTable, type SectionGroup } from '@/components/admin/AdminResourceTable'

export default async function AdminResourcesPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/login')

  const resources = await prisma.learningResource.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      isPublished: true,
      updatedAt: true,
      courseSectionId: true,
      courseSection: {
        select: { sectionCode: true, course: { select: { code: true, title: true } } },
      },
      lecturer: { select: { fullName: true } },
      attachments: { select: { id: true } },
    },
    orderBy: [{ courseSectionId: 'asc' }, { type: 'asc' }, { title: 'asc' }],
  })

  const totalPublished = resources.filter((r) => r.isPublished).length
  const totalDrafts = resources.length - totalPublished

  // Preserve insertion-order section grouping (resources already ordered by courseSectionId asc).
  const sectionIds = [...new Set(resources.map((r) => r.courseSectionId))]

  const groups: SectionGroup[] = sectionIds.map((sectionId) => {
    const sectionResources = resources.filter((r) => r.courseSectionId === sectionId)
    const cs = sectionResources[0].courseSection
    return {
      sectionId,
      sectionLabel: `${cs.course.code} · Sec ${cs.sectionCode}`,
      courseTitle: cs.course.title,
      resources: sectionResources.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description ?? null,
        type: r.type.toLowerCase(),
        isPublished: r.isPublished,
        uploaderName: r.lecturer.fullName,
        attachmentCount: r.attachments.length,
        updatedAt: r.updatedAt.toISOString(),
      })),
    }
  })

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-[--text-primary]">Resource Moderation</h1>
        <p className="mt-0.5 text-sm text-[--text-secondary]">Administrator</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-[--text-secondary]">Total Resources</p>
            <p className="mt-1 text-2xl font-semibold text-[--text-primary]">{resources.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-[--text-secondary]">Published</p>
            <p className="mt-1 text-2xl font-semibold text-[--text-primary]">{totalPublished}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-[--text-secondary]">Drafts</p>
            <p className="mt-1 text-2xl font-semibold text-[--text-primary]">{totalDrafts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-[--text-secondary]">Sections Covered</p>
            <p className="mt-1 text-2xl font-semibold text-[--text-primary]">{sectionIds.length}</p>
          </CardContent>
        </Card>
      </div>

      <AdminResourceTable groups={groups} />
    </div>
  )
}
