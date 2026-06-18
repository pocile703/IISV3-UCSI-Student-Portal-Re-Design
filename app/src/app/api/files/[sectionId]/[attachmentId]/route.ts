// GET /api/files/[sectionId]/[attachmentId]
//
// Serves a stored resource attachment after verifying authorization.
// sectionId is a path segment (not a query param) — harder to misuse and
// enables cleaner middleware/cache reasoning per route prefix.
//
// Security:
//   - requireApiAuth() re-validates isActive + sessionVersion.
//   - IDOR guard: attachment.resource.courseSectionId must match :sectionId path param.
//   - Student: isPublished check + StudentSectionEnrollment(ENROLLED) check.
//   - Lecturer: TeachingAssignment check (no isPublished requirement — can preview drafts).
//   - Admin: no section ownership check (global moderation access).
//   - downloadCount incremented fire-and-forget; measures requests served (file read from
//     disk), not bytes confirmed received by the client.

import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api-guard'
import { prisma } from '@/lib/prisma'
import { attachmentIdSchema, sectionIdSchema } from '@/lib/schemas'
import { readFile } from '@/lib/storage'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sectionId: string; attachmentId: string }> },
) {
  const guard = await requireApiAuth()
  if (guard instanceof Response) return guard

  const { role, studentId, lecturerId } = guard
  const { sectionId, attachmentId } = await params

  const parsedId      = attachmentIdSchema.safeParse(attachmentId)
  const parsedSection = sectionIdSchema.safeParse(sectionId)

  if (!parsedId.success)      return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!parsedSection.success) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const attachment = await prisma.resourceAttachment.findUnique({
    where:  { id: parsedId.data },
    select: {
      storageKey:       true,
      originalFilename: true,
      mimeType:         true,
      resource: {
        select: { courseSectionId: true, isPublished: true },
      },
    },
  })

  if (!attachment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // IDOR guard — attachment must belong to the asserted section.
  if (attachment.resource.courseSectionId !== parsedSection.data) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Role-based authorization
  if (role === 'student') {
    if (!studentId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!attachment.resource.isPublished) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const enrollment = await prisma.studentSectionEnrollment.findUnique({
      where: {
        studentId_courseSectionId: { studentId, courseSectionId: parsedSection.data },
      },
      select: { status: true },
    })
    if (enrollment?.status !== 'ENROLLED') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else if (role === 'lecturer') {
    if (!lecturerId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const assignment = await prisma.teachingAssignment.findUnique({
      where: {
        lecturerId_courseSectionId: { lecturerId, courseSectionId: parsedSection.data },
      },
      select: { id: true },
    })
    if (!assignment) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } else if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Read from local storage
  let fileBuffer: Buffer
  try {
    fileBuffer = await readFile(attachment.storageKey)
  } catch {
    return NextResponse.json({ error: 'File not found on server' }, { status: 404 })
  }

  // Fire-and-forget. Measures requests served (file read from disk), not bytes
  // confirmed received — client network drops after this point are not counted.
  prisma.resourceAttachment
    .update({
      where: { id: parsedId.data },
      data:  { downloadCount: { increment: 1 } },
    })
    .catch(() => {})

  // new Uint8Array(buffer: ArrayLike<number>) produces Uint8Array<ArrayBuffer>,
  // which satisfies BlobPart — avoids Buffer<ArrayBufferLike> BodyInit mismatch.
  return new NextResponse(new Blob([new Uint8Array(fileBuffer)]), {
    status: 200,
    headers: {
      'Content-Type':        attachment.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.originalFilename)}"`,
      'Content-Length':      String(fileBuffer.byteLength),
      'Cache-Control':       'no-store',
    },
  })
}
