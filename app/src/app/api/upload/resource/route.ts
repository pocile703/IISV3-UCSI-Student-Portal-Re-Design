// POST /api/upload/resource
//
// Authorization: lecturer only.
// Gate 1: TeachingAssignment(lecturerId, sectionId).
// sectionId comes from the form body (not a URL param here), but is validated
// server-side and compared against TeachingAssignment — never trusted blindly.
//
// Security:
//   - requireApiAuth() re-validates isActive + sessionVersion.
//   - File size checked before disk write (100 MB hard cap).
//   - MIME type verified via magic-bytes inspection, not Content-Type header.
//   - HTML / JS / SVG never in whitelist (stored-XSS prevention).
//   - storageKey generated server-side; never accepted from the client.
//   - If storage write fails, the LearningResource row is rolled back.

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireApiAuth } from '@/lib/api-guard'
import { prisma } from '@/lib/prisma'
import { sectionIdSchema, resourceTypeSchema, titleSchema, descriptionSchema } from '@/lib/schemas'
import { makeStorageKey, writeFile, deleteFile } from '@/lib/storage'

export const maxDuration = 60

const MAX_BYTES = 100 * 1024 * 1024  // 100 MB

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'video/webm',
  'image/jpeg',
  'image/png',
  'application/zip',
])

// Magic-bytes MIME detection. Never trust the browser-supplied Content-Type.
// Returns the validated MIME type or null if unrecognised / not in whitelist.
function detectMimeType(buf: Buffer, browserMime: string): string | null {
  // PDF: %PDF
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46)
    return 'application/pdf'
  // JPEG: FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF)
    return 'image/jpeg'
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47)
    return 'image/png'
  // MP4: "ftyp" at bytes 4-7
  if (buf.length >= 8 && buf.subarray(4, 8).toString('ascii') === 'ftyp')
    return 'video/mp4'
  // WebM: 1A 45 DF A3
  if (buf[0] === 0x1A && buf[1] === 0x45 && buf[2] === 0xDF && buf[3] === 0xA3)
    return 'video/webm'
  // ZIP-based: PK\x03\x04 — covers DOCX, PPTX, and plain ZIP
  if (buf[0] === 0x50 && buf[1] === 0x4B && buf[2] === 0x03 && buf[3] === 0x04) {
    const zipAllowed = new Set([
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
    ])
    return zipAllowed.has(browserMime) ? browserMime : 'application/zip'
  }
  // CFB-based: D0 CF 11 E0 — covers old binary DOC, PPT
  if (buf[0] === 0xD0 && buf[1] === 0xCF && buf[2] === 0x11 && buf[3] === 0xE0) {
    const cfbAllowed = new Set(['application/vnd.ms-powerpoint', 'application/msword'])
    return cfbAllowed.has(browserMime) ? browserMime : null
  }
  return null
}

const metaSchema = z.object({
  sectionId:   sectionIdSchema,
  title:       titleSchema,
  description: descriptionSchema,
  type:        resourceTypeSchema,
  isPublished: z.enum(['true', 'false']).transform(v => v === 'true'),
})

export async function POST(req: NextRequest) {
  const guard = await requireApiAuth()
  if (guard instanceof Response) return guard

  const { lecturerId, role } = guard
  if (!lecturerId || role !== 'lecturer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 400 })
  }

  // Validate metadata fields
  const parsed = metaSchema.safeParse({
    sectionId:   formData.get('sectionId'),
    title:       formData.get('title'),
    description: formData.get('description') || undefined,
    type:        formData.get('type'),
    isPublished: formData.get('isPublished') ?? 'false',
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 422 },
    )
  }

  const { sectionId, title, description, type, isPublished } = parsed.data

  // Gate 1: TeachingAssignment — lecturer must be assigned to this section.
  const assignment = await prisma.teachingAssignment.findUnique({
    where: { lecturerId_courseSectionId: { lecturerId, courseSectionId: sectionId } },
    select: { id: true },
  })
  if (!assignment) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // File presence and size check
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty' }, { status: 422 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File must be under 100 MB' }, { status: 413 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // Magic-bytes MIME validation
  const validatedMime = detectMimeType(buffer, file.type)
  if (!validatedMime || !ALLOWED_MIME_TYPES.has(validatedMime)) {
    return NextResponse.json(
      { error: 'File type not allowed. Accepted: PDF, PowerPoint, Word, MP4, WebM, JPEG, PNG, ZIP' },
      { status: 422 },
    )
  }

  // Create LearningResource first — its id anchors the storage key path.
  const resource = await prisma.learningResource.create({
    data: {
      courseSectionId: sectionId,    // from validated form field, not URL param — still safe
      uploadedBy:      lecturerId,   // Lecturer.id — never from client
      title,
      description:     description ?? null,
      type:            type.toUpperCase() as never,
      isPublished,
    },
    select: { id: true },
  })

  // Write to local storage
  const key = makeStorageKey(sectionId, resource.id, file.name)
  try {
    await writeFile(key, buffer)
  } catch (err) {
    // Roll back the resource row if storage write fails — orphaned rows are worse than no row.
    await prisma.learningResource.delete({ where: { id: resource.id } }).catch(() => {})
    console.error('[upload] storage write failed', err)
    return NextResponse.json({ error: 'Storage error — please try again' }, { status: 500 })
  }

  // Record attachment metadata.
  // If this write fails, roll back both the storage file and the resource row —
  // an orphaned resource row (no attachment) is a worse state than a clean failure.
  let attachment: { id: string }
  try {
    attachment = await prisma.resourceAttachment.create({
      data: {
        resourceId:       resource.id,
        originalFilename: file.name,
        mimeType:         validatedMime,
        fileSizeBytes:    BigInt(file.size),
        storageKey:       key,
      },
      select: { id: true },
    })
  } catch (err) {
    await deleteFile(key).catch(() => {})
    await prisma.learningResource.delete({ where: { id: resource.id } }).catch(() => {})
    console.error('[upload] attachment create failed', err)
    return NextResponse.json({ error: 'Database error — please try again' }, { status: 500 })
  }

  revalidatePath(`/lecturer/resources/${sectionId}`)
  revalidatePath('/classes')
  revalidatePath('/lecturer')
  revalidatePath('/lecturer/resources')

  return NextResponse.json({ resourceId: resource.id, attachmentId: attachment.id }, { status: 201 })
}
