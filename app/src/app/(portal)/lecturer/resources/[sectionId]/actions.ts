'use server'

// Phase 6: Lecturer resource + post mutations for a specific course section.
//
// Authorization model (two-gate — every write action must pass both):
//   Gate 1 (assertSection): TeachingAssignment — lecturer is assigned to this section.
//   Gate 2 (per-action): uploadedBy / authorId — lecturer owns the specific record.
//
// Identifier spaces — do NOT conflate:
//   LearningResource.uploadedBy → Lecturer.id  → compare with session.user.lecturerId
//   ClassPost.authorId          → User.id       → compare with session.user.id
//
// courseSectionId SOURCE RULE: always derived from the URL sectionId param (bound by
// the page component). Never read from formData — a form-submitted sectionId would allow
// a lecturer to write content to an arbitrary section.
//
// Global post rule: courseSectionId must NEVER be null for lecturer posts. Null means
// a global admin announcement. The assertSection gate enforces this implicitly (it
// rejects any sectionId that has no TeachingAssignment for this lecturer).

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getValidatedSession } from '@/lib/session-guard'
import { deleteFile } from '@/lib/storage'
import {
  resourceTypeSchema,
  resourceIdSchema,
  postTypeSchema,
  postIdSchema,
  sectionIdSchema,
  titleSchema,
  bodySchema,
  descriptionSchema,
} from '@/lib/schemas'

// ─── Shared authorization helper ────────────────────────────────────────────

async function assertSection(sectionId: string) {
  const session = await getValidatedSession()
  const lecturerId = session.user.lecturerId
  // M5: explicit role check — getValidatedSession() validates session but NOT role.
  if (!lecturerId || session.user.role !== 'lecturer') redirect('/login')

  // Gate 1: verify this lecturer has a TeachingAssignment for the section.
  const assignment = await prisma.teachingAssignment.findUnique({
    where: { lecturerId_courseSectionId: { lecturerId, courseSectionId: sectionId } },
    select: { id: true },
  })
  if (!assignment) redirect('/lecturer/resources')

  return { lecturerId, userId: session.user.id }
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'
}

async function assertPostSection(sectionId: string) {
  const parsedSectionId = sectionIdSchema.safeParse(sectionId)
  if (!parsedSectionId.success) return { error: parsedSectionId.error.issues[0]?.message ?? 'Invalid section ID' } as const

  const auth = await assertSection(parsedSectionId.data)
  return { ...auth, sectionId: parsedSectionId.data } as const
}

async function assertResourceSection(sectionId: string) {
  const parsedSectionId = sectionIdSchema.safeParse(sectionId)
  if (!parsedSectionId.success) return { error: parsedSectionId.error.issues[0]?.message ?? 'Invalid section ID' } as const

  const auth = await assertSection(parsedSectionId.data)
  return { ...auth, sectionId: parsedSectionId.data } as const
}

async function assertOwnedResource(sectionId: string, resourceId: string, lecturerId: string) {
  const parsedResourceId = resourceIdSchema.safeParse(resourceId)
  if (!parsedResourceId.success) return { error: parsedResourceId.error.issues[0]?.message ?? 'Invalid resource ID' } as const

  const resource = await prisma.learningResource.findUnique({
    where: { id: parsedResourceId.data },
    select: { uploadedBy: true, courseSectionId: true, isPublished: true },
  })
  if (!resource || resource.courseSectionId !== sectionId) return { error: 'Not found' } as const
  if (resource.uploadedBy !== lecturerId) return { error: 'Forbidden' } as const

  return { resource, resourceId: parsedResourceId.data } as const
}

async function assertOwnedPost(sectionId: string, postId: string, userId: string) {
  const parsedPostId = postIdSchema.safeParse(postId)
  if (!parsedPostId.success) return { error: parsedPostId.error.issues[0]?.message ?? 'Invalid post ID' } as const

  const post = await prisma.classPost.findUnique({
    where: { id: parsedPostId.data },
    select: { authorId: true, courseSectionId: true, isPinned: true },
  })
  if (!post || post.courseSectionId !== sectionId) return { error: 'Not found' } as const
  if (post.authorId !== userId) return { error: 'Forbidden' } as const

  return { post, postId: parsedPostId.data } as const
}

function revalidateSectionPostContent(sectionId: string) {
  revalidatePath(`/lecturer/resources/${sectionId}`)
  revalidatePath('/classes')
  revalidatePath('/dashboard')
  revalidatePath('/lecturer')
  revalidatePath('/lecturer/resources')
}

function revalidateSectionPostPin(sectionId: string) {
  revalidatePath(`/lecturer/resources/${sectionId}`)
  revalidatePath('/classes')
}

function revalidateSectionResource(sectionId: string) {
  revalidatePath(`/lecturer/resources/${sectionId}`)
  revalidatePath('/classes')
  revalidatePath('/lecturer')
  revalidatePath('/lecturer/resources')
}

// ─── Resource mutations ──────────────────────────────────────────────────────
// uploadResource is handled by POST /api/upload/resource (Route Handler).
// That handler creates both LearningResource and ResourceAttachment in one request.

type ResourceState = { error?: string; success?: boolean }

const resourceSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  type: resourceTypeSchema,
  isPublished: z.boolean().default(false),
})

// Bound by the page: editResource.bind(null, sectionId, resourceId)
export async function editResource(
  sectionId: string,
  resourceId: string,
  _prev: ResourceState,
  formData: FormData,
): Promise<ResourceState> {
  const scoped = await assertResourceSection(sectionId)
  if ('error' in scoped) return { error: scoped.error }

  const ownedResource = await assertOwnedResource(scoped.sectionId, resourceId, scoped.lecturerId)
  if ('error' in ownedResource) return { error: ownedResource.error }

  const parsed = resourceSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    type: formData.get('type'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  try {
    await prisma.learningResource.update({
      where: { id: ownedResource.resourceId },
      data: {
        // courseSectionId is intentionally NOT updated — never allow moving a resource
        // to a different section, even one the lecturer is also assigned to.
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        type: parsed.data.type.toUpperCase() as never,
      },
    })
  } catch (error) {
    if (isNotFoundError(error)) return { error: 'Not found' }
    throw error
  }

  revalidateSectionResource(scoped.sectionId)
  return { success: true }
}

// Bound by the page: togglePublish.bind(null, sectionId, resourceId)
export async function togglePublish(
  sectionId: string,
  resourceId: string,
): Promise<ResourceState> {
  const scoped = await assertResourceSection(sectionId)
  if ('error' in scoped) return { error: scoped.error }

  const ownedResource = await assertOwnedResource(scoped.sectionId, resourceId, scoped.lecturerId)
  if ('error' in ownedResource) return { error: ownedResource.error }

  try {
    await prisma.learningResource.update({
      where: { id: ownedResource.resourceId },
      data: { isPublished: !ownedResource.resource.isPublished },
    })
  } catch (error) {
    if (isNotFoundError(error)) return { error: 'Not found' }
    throw error
  }

  revalidateSectionResource(scoped.sectionId)
  return { success: true }
}

// Bound by the page: deleteResource.bind(null, sectionId, resourceId)
export async function deleteResource(
  sectionId: string,
  resourceId: string,
): Promise<ResourceState> {
  const scoped = await assertResourceSection(sectionId)
  if ('error' in scoped) return { error: scoped.error }

  const ownedResource = await assertOwnedResource(scoped.sectionId, resourceId, scoped.lecturerId)
  if ('error' in ownedResource) return { error: ownedResource.error }

  // Collect storage keys before the DB delete (cascade removes attachment rows).
  const attachments = await prisma.resourceAttachment.findMany({
    where:  { resourceId: ownedResource.resourceId },
    select: { storageKey: true },
  })

  // ResourceAttachment rows are cascade-deleted by the schema (onDelete: Cascade).
  try {
    await prisma.learningResource.delete({ where: { id: ownedResource.resourceId } })
  } catch (error) {
    if (isNotFoundError(error)) return { error: 'Not found' }
    throw error
  }

  // Clean up stored files — best-effort, fire-and-forget.
  for (const att of attachments) {
    deleteFile(att.storageKey).catch(() => {})
  }

  revalidateSectionResource(scoped.sectionId)
  return { success: true }
}

// ─── Post mutations ──────────────────────────────────────────────────────────

type PostState = { error?: string; success?: boolean }

const postSchema = z.object({
  title: titleSchema,
  body: bodySchema,
  type: postTypeSchema,
  isPinned: z.boolean().default(false),
})

// Bound by the page: createPost.bind(null, sectionId)
export async function createPost(
  sectionId: string,
  _prev: PostState,
  formData: FormData,
): Promise<PostState> {
  // assertSection returns both lecturerId (Lecturer.id) and userId (User.id).
  // Posts use userId (authorId → User.id), not lecturerId.
  const scoped = await assertPostSection(sectionId)
  if ('error' in scoped) return { error: scoped.error }
  const { userId, sectionId: validatedSectionId } = scoped

  const parsed = postSchema.safeParse({
    title: formData.get('title'),
    body: formData.get('body'),
    type: formData.get('type'),
    isPinned: formData.get('isPinned') === 'true',
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  await prisma.classPost.create({
    data: {
      courseSectionId: validatedSectionId,       // from URL param — NEVER null for lecturer posts
      authorId: userId,                          // User.id — NOT lecturerId (different namespace)
      title: parsed.data.title,
      body: parsed.data.body,
      type: parsed.data.type.toUpperCase() as never,
      isPinned: parsed.data.isPinned,
      isPublished: true,
    },
  })

  revalidateSectionPostContent(validatedSectionId)
  return { success: true }
}

// Bound by the page: editPost.bind(null, sectionId, postId)
export async function editPost(
  sectionId: string,
  postId: string,
  _prev: PostState,
  formData: FormData,
): Promise<PostState> {
  const scoped = await assertPostSection(sectionId)
  if ('error' in scoped) return { error: scoped.error }

  const ownedPost = await assertOwnedPost(scoped.sectionId, postId, scoped.userId)
  if ('error' in ownedPost) return { error: ownedPost.error }

  const parsed = postSchema.safeParse({
    title: formData.get('title'),
    body: formData.get('body'),
    type: formData.get('type'),
    isPinned: formData.get('isPinned') === 'true',
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  try {
    await prisma.classPost.update({
      where: { id: ownedPost.postId },
      data: {
        // courseSectionId intentionally NOT updated — never re-scope a post to another section.
        title: parsed.data.title,
        body: parsed.data.body,
        type: parsed.data.type.toUpperCase() as never,
        isPinned: parsed.data.isPinned,
      },
    })
  } catch (error) {
    if (isNotFoundError(error)) return { error: 'Not found' }
    throw error
  }

  revalidateSectionPostContent(scoped.sectionId)
  return { success: true }
}

// Bound by the page: togglePin.bind(null, sectionId, postId)
export async function togglePin(sectionId: string, postId: string): Promise<PostState> {
  const scoped = await assertPostSection(sectionId)
  if ('error' in scoped) return { error: scoped.error }

  const ownedPost = await assertOwnedPost(scoped.sectionId, postId, scoped.userId)
  if ('error' in ownedPost) return { error: ownedPost.error }

  try {
    await prisma.classPost.update({
      where: { id: ownedPost.postId },
      data: { isPinned: !ownedPost.post.isPinned },
    })
  } catch (error) {
    if (isNotFoundError(error)) return { error: 'Not found' }
    throw error
  }

  revalidateSectionPostPin(scoped.sectionId)
  return { success: true }
}

// Bound by the page: deletePost.bind(null, sectionId, postId)
export async function deletePost(sectionId: string, postId: string): Promise<PostState> {
  const scoped = await assertPostSection(sectionId)
  if ('error' in scoped) return { error: scoped.error }

  const ownedPost = await assertOwnedPost(scoped.sectionId, postId, scoped.userId)
  if ('error' in ownedPost) return { error: ownedPost.error }

  try {
    await prisma.classPost.delete({ where: { id: ownedPost.postId } })
  } catch (error) {
    if (isNotFoundError(error)) return { error: 'Not found' }
    throw error
  }

  revalidateSectionPostContent(scoped.sectionId)
  return { success: true }
}
