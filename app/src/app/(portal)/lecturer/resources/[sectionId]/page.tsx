import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ResourceManager } from '@/components/lecturer/SectionResourceManager'
import { ClassPostPanel } from '@/components/lecturer/ClassPostPanel'
import { DAY_LABELS } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import {
  editResource,
  deleteResource,
  togglePublish,
  createPost,
  editPost,
  togglePin,
  deletePost,
} from './actions'

type PostState = { error?: string; success?: boolean }
import type { LearningResource, ResourceAttachment, ResourceType } from '@/types/resource'
import type { ClassPost, PostType } from '@/types/post'

type ResourceState = { error?: string; success?: boolean }

interface PageProps {
  params: Promise<{ sectionId: string }>
}

export default async function SectionResourceManagerPage({ params }: PageProps) {
  const session = await auth()
  const lecturerId = session?.user?.lecturerId
  if (!lecturerId || session.user.role !== 'lecturer') redirect('/login')

  const { sectionId } = await params

  // Gate 1: TeachingAssignment check + fetch section/course header data in one query.
  const assignment = await prisma.teachingAssignment.findUnique({
    where: { lecturerId_courseSectionId: { lecturerId, courseSectionId: sectionId } },
    select: {
      courseSection: {
        select: {
          sectionCode: true,
          room: true,
          dayOfWeek: true,
          timeStart: true,
          timeEnd: true,
          course: { select: { code: true, title: true } },
        },
      },
    },
  })
  if (!assignment) redirect('/lecturer/resources')

  const { courseSection: cs } = assignment

  // DB dayOfWeek is 0-indexed (0=Mon…6=Sun), same as DAY_LABELS array index.
  const day = DAY_LABELS[cs.dayOfWeek] ?? '—'
  // @db.Time comes back as a Date object at epoch (1970-01-01) — format as HH:MM.
  const timeStart = cs.timeStart instanceof Date
    ? cs.timeStart.toISOString().slice(11, 16)
    : String(cs.timeStart).slice(0, 5)
  const timeEnd = cs.timeEnd instanceof Date
    ? cs.timeEnd.toISOString().slice(11, 16)
    : String(cs.timeEnd).slice(0, 5)

  // Fetch resources (with attachments) and posts in parallel.
  const [resourceRows, postRows] = await Promise.all([
    prisma.learningResource.findMany({
      where: { courseSectionId: sectionId },
      select: {
        id: true,
        courseSectionId: true,
        uploadedBy: true,
        title: true,
        description: true,
        type: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
        attachments: {
          select: {
            id: true,
            resourceId: true,
            originalFilename: true,
            mimeType: true,
            fileSizeBytes: true,
            downloadCount: true,
            // storageKey intentionally excluded — internal storage path, never sent to client
          },
        },
      },
      orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.classPost.findMany({
      where: { courseSectionId: sectionId },
      select: {
        id: true,
        courseSectionId: true,
        authorId: true,
        title: true,
        body: true,
        type: true,
        isPinned: true,
        isPublished: true,
        createdAt: true,
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    }),
  ])

  const resources: LearningResource[] = resourceRows.map(r => ({
    id: r.id,
    courseSectionId: r.courseSectionId,
    uploadedBy: r.uploadedBy,
    title: r.title,
    description: r.description ?? undefined,
    type: r.type.toLowerCase() as ResourceType,
    isPublished: r.isPublished,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    attachments: r.attachments.map(a => ({
      id: a.id,
      resourceId: a.resourceId,
      originalFilename: a.originalFilename,
      mimeType: a.mimeType,
      fileSizeBytes: Number(a.fileSizeBytes),   // BigInt → number
      downloadCount: a.downloadCount,
    })),
  }))

  // ResourceManager expects a flat attachments array in addition to resources.attachments.
  const attachments: ResourceAttachment[] = resources.flatMap(r => r.attachments ?? [])
  const resourceSnapshotKey = `resources:${resources
    .map((r) => `${r.id}:${r.updatedAt}:${r.isPublished ? '1' : '0'}`)
    .join('|')}`

  const posts: ClassPost[] = postRows.map(p => ({
    id: p.id,
    courseSectionId: p.courseSectionId,
    authorId: p.authorId,
    title: p.title,
    body: p.body,
    type: p.type.toLowerCase() as PostType,
    isPinned: p.isPinned,
    isPublished: p.isPublished,
    createdAt: p.createdAt.toISOString(),
  }))
  const postSnapshotKey = `posts:${posts
    .map((p) => `${p.id}:${p.createdAt}:${p.isPinned ? '1' : '0'}:${p.isPublished ? '1' : '0'}`)
    .join('|')}`

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb + header */}
      <div>
        <Link
          href="/lecturer/resources"
          className="mb-2 inline-flex items-center gap-1 text-xs text-[--text-secondary] hover:text-[#C1272D] transition-colors"
        >
          <ChevronLeft size={13} aria-hidden="true" />
          My Classes
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span className="text-lg font-bold" style={{ color: 'var(--ucsi-red)' }}>
            {cs.course.code}
          </span>
          <h1 className="text-xl font-semibold text-[--text-primary]">{cs.course.title}</h1>
        </div>
        <p className="mt-0.5 text-sm text-[--text-secondary]">
          Sec {cs.sectionCode} · {cs.room ?? '—'} · {day} {timeStart}–{timeEnd}
        </p>
      </div>

      {/* Two-column layout: resources left, posts right */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_380px]">
        <ResourceManager
          key={resourceSnapshotKey}
          sectionId={sectionId}
          resources={resources}
          attachments={attachments}
          editActionBase={editResource.bind(null, sectionId) as (resourceId: string, _prev: ResourceState, formData: FormData) => Promise<ResourceState>}
          deleteActionBase={deleteResource.bind(null, sectionId) as (resourceId: string) => Promise<ResourceState>}
          toggleActionBase={togglePublish.bind(null, sectionId) as (resourceId: string) => Promise<ResourceState>}
        />
        <ClassPostPanel
          key={postSnapshotKey}
          posts={posts}
          currentUserId={session.user.id}
          createAction={createPost.bind(null, sectionId) as (_prev: PostState, formData: FormData) => Promise<PostState>}
          editActionBase={editPost.bind(null, sectionId) as (postId: string, _prev: PostState, formData: FormData) => Promise<PostState>}
          togglePinBase={togglePin.bind(null, sectionId) as (postId: string) => Promise<PostState>}
          deleteActionBase={deletePost.bind(null, sectionId) as (postId: string) => Promise<PostState>}
        />
      </div>
    </div>
  )
}
