'use server'

// Phase 6: Admin post moderation actions.
//
// Authorization: admin role only.
// No TeachingAssignment check — admin is global across all sections.
// No ownership Gate 2 — admin may moderate any post regardless of author.
//
// These actions complement the lecturer-scoped mutations in
// lecturer/resources/[sectionId]/actions.ts. Admin moderates existing posts;
// admin does NOT create or edit section-scoped lecturer posts.
//
// Global announcements (courseSectionId = null) may only be created/edited by admin —
// that surface is Phase 6 admin CRUD (not this file). Moderation actions here apply
// to both section-scoped and global posts.

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getValidatedSession } from '@/lib/session-guard'
import { postIdSchema, resourceIdSchema } from '@/lib/schemas'

type ModerationState = { error?: string; success?: boolean }

// ─── Authorization helper ────────────────────────────────────────────────────

async function assertAdmin() {
  const session = await getValidatedSession()
  // M5: explicit role check — getValidatedSession() validates session but NOT role.
  if (session.user.role !== 'admin') redirect('/login')
  return session
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'
}

async function assertModeratedPost(postId: string) {
  const parsedPostId = postIdSchema.safeParse(postId)
  if (!parsedPostId.success) return { error: parsedPostId.error.issues[0]?.message ?? 'Invalid post ID' } as const

  const post = await prisma.classPost.findUnique({
    where: { id: parsedPostId.data },
    select: { courseSectionId: true, isPinned: true, isPublished: true },
  })
  if (!post) return { error: 'Post not found' } as const

  return { post, postId: parsedPostId.data } as const
}

// ─── Shared revalidation helper ──────────────────────────────────────────────

// Revalidates all surfaces that display the affected post.
// Fetches courseSectionId so the specific lecturer page cache is also cleared.
function revalidatePost(courseSectionId: string | null) {
  revalidatePath('/admin')
  revalidatePath('/admin/resources')
  revalidatePath('/dashboard')
  if (courseSectionId) {
    revalidatePath('/classes')
    revalidatePath('/lecturer')
    revalidatePath('/lecturer/resources')
    revalidatePath(`/lecturer/resources/${courseSectionId}`)
  }
}

// ─── Post moderation mutations ───────────────────────────────────────────────

// Admin delete: removes any post regardless of author or section.
// sectionId is not required — admin operates across all sections.
export async function adminDeletePost(postId: string): Promise<ModerationState> {
  await assertAdmin()

  const moderatedPost = await assertModeratedPost(postId)
  if ('error' in moderatedPost) return { error: moderatedPost.error }

  try {
    await prisma.classPost.delete({ where: { id: moderatedPost.postId } })
  } catch (error) {
    if (isNotFoundError(error)) return { error: 'Post not found' }
    throw error
  }

  revalidatePost(moderatedPost.post.courseSectionId)
  return { success: true }
}

// Admin pin/unpin: toggles any post's pinned state without ownership check.
export async function adminTogglePin(postId: string): Promise<ModerationState> {
  await assertAdmin()

  const moderatedPost = await assertModeratedPost(postId)
  if ('error' in moderatedPost) return { error: moderatedPost.error }

  try {
    await prisma.classPost.update({
      where: { id: moderatedPost.postId },
      data: { isPinned: !moderatedPost.post.isPinned },
    })
  } catch (error) {
    if (isNotFoundError(error)) return { error: 'Post not found' }
    throw error
  }

  revalidatePost(moderatedPost.post.courseSectionId)
  return { success: true }
}

// Admin publish/unpublish: overrides a lecturer's published state for policy reasons.
// Separate from lecturer togglePublish — admin does not hold a TeachingAssignment.
export async function adminTogglePublishPost(postId: string): Promise<ModerationState> {
  await assertAdmin()

  const moderatedPost = await assertModeratedPost(postId)
  if ('error' in moderatedPost) return { error: moderatedPost.error }

  try {
    await prisma.classPost.update({
      where: { id: moderatedPost.postId },
      data: { isPublished: !moderatedPost.post.isPublished },
    })
  } catch (error) {
    if (isNotFoundError(error)) return { error: 'Post not found' }
    throw error
  }

  revalidatePost(moderatedPost.post.courseSectionId)
  return { success: true }
}

// ─── Resource moderation mutations ──────────────────────────────────────────

async function assertModeratedResource(resourceId: string) {
  const parsedId = resourceIdSchema.safeParse(resourceId)
  if (!parsedId.success) return { error: parsedId.error.issues[0]?.message ?? 'Invalid resource ID' } as const

  const resource = await prisma.learningResource.findUnique({
    where: { id: parsedId.data },
    select: { courseSectionId: true, isPublished: true },
  })
  if (!resource) return { error: 'Resource not found' } as const

  return { resource, resourceId: parsedId.data } as const
}

function revalidateResource(courseSectionId: string) {
  revalidatePath('/admin')
  revalidatePath('/admin/resources')
  revalidatePath('/classes')
  revalidatePath('/lecturer')
  revalidatePath('/lecturer/resources')
  revalidatePath(`/lecturer/resources/${courseSectionId}`)
}

// Admin delete: removes any resource regardless of uploader or section.
export async function adminDeleteResource(resourceId: string): Promise<ModerationState> {
  await assertAdmin()

  const moderated = await assertModeratedResource(resourceId)
  if ('error' in moderated) return { error: moderated.error }

  try {
    // ResourceAttachment rows are cascade-deleted by the schema.
    await prisma.learningResource.delete({ where: { id: moderated.resourceId } })
  } catch (error) {
    if (isNotFoundError(error)) return { error: 'Resource not found' }
    throw error
  }

  revalidateResource(moderated.resource.courseSectionId)
  return { success: true }
}

// Admin publish/unpublish: overrides a lecturer's published state for policy reasons.
export async function adminTogglePublishResource(resourceId: string): Promise<ModerationState> {
  await assertAdmin()

  const moderated = await assertModeratedResource(resourceId)
  if ('error' in moderated) return { error: moderated.error }

  try {
    await prisma.learningResource.update({
      where: { id: moderated.resourceId },
      data: { isPublished: !moderated.resource.isPublished },
    })
  } catch (error) {
    if (isNotFoundError(error)) return { error: 'Resource not found' }
    throw error
  }

  revalidateResource(moderated.resource.courseSectionId)
  return { success: true }
}
