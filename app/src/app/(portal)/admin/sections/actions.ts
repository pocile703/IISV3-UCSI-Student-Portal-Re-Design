'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getValidatedSession } from '@/lib/session-guard'
import {
  sectionIdSchema,
  courseIdSchema,
  semesterIdSchema,
  lecturerOptSchema,
  sectionCodeSchema,
  roomSchema,
  dayOfWeekSchema,
  timeFieldSchema,
  maxCapacitySchema,
} from '@/lib/schemas'

type ActionState = { error?: string; success?: boolean }

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function assertAdmin() {
  const session = await getValidatedSession()
  // M5: explicit role check — getValidatedSession() validates session but does NOT assert role.
  if (session.user.role !== 'admin') redirect('/login')
  return session
}

// ─── Error helpers ────────────────────────────────────────────────────────────

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
  )
}

function isNotFoundError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025'
  )
}

async function assertAssignableLecturer(lecturerId: string) {
  const lecturer = await prisma.lecturer.findUnique({
    where: { id: lecturerId },
    select: { id: true, user: { select: { isActive: true } } },
  })
  if (!lecturer) return { error: 'Lecturer not found' } as const
  if (!lecturer.user.isActive) return { error: 'Selected lecturer is inactive' } as const
  return { success: true } as const
}

// ─── Time helper ──────────────────────────────────────────────────────────────

// Converts "HH:MM" form input to a Date for Prisma @db.Time storage.
// Uses UTC anchor to match how the seed inserts times: new Date('1970-01-01T09:00:00.000Z')
function parseTime(hhmm: string): Date {
  return new Date(`1970-01-01T${hhmm}:00.000Z`)
}

// ─── Shared form schema ───────────────────────────────────────────────────────

const sectionFormSchema = z.object({
  courseId: courseIdSchema,
  semesterId: semesterIdSchema,
  sectionCode: sectionCodeSchema,
  room: roomSchema,
  dayOfWeek: dayOfWeekSchema,
  timeStart: timeFieldSchema,
  timeEnd: timeFieldSchema,
  maxCapacity: maxCapacitySchema,
  lecturerId: lecturerOptSchema,
})

const updateFormSchema = sectionFormSchema.extend({
  isActive: z
    .enum(['true', 'false'], { message: 'Invalid status value' })
    .transform((v) => v === 'true'),
})

// ─── adminCreateSection ────────────────────────────────────────────────────────

export async function adminCreateSection(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertAdmin()

  const parsed = sectionFormSchema.safeParse({
    courseId: formData.get('courseId'),
    semesterId: formData.get('semesterId'),
    sectionCode: formData.get('sectionCode'),
    room: formData.get('room'),
    dayOfWeek: formData.get('dayOfWeek'),
    timeStart: formData.get('timeStart'),
    timeEnd: formData.get('timeEnd'),
    maxCapacity: formData.get('maxCapacity'),
    lecturerId: formData.get('lecturerId'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const {
    courseId,
    semesterId,
    sectionCode,
    room,
    dayOfWeek,
    timeStart: ts,
    timeEnd: te,
    maxCapacity,
    lecturerId,
  } = parsed.data

  // Cross-field: end time must be after start time
  if (te <= ts) return { error: 'End time must be after start time' }

  // FK existence — prevent phantom UUID injection
  const [course, semester] = await Promise.all([
    prisma.course.findUnique({ where: { id: courseId }, select: { id: true } }),
    prisma.semester.findUnique({ where: { id: semesterId }, select: { id: true } }),
  ])
  if (!course) return { error: 'Course not found' }
  if (!semester) return { error: 'Semester not found' }

  if (lecturerId) {
    const lecturerCheck = await assertAssignableLecturer(lecturerId)
    if ('error' in lecturerCheck) return { error: lecturerCheck.error }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const section = await tx.courseSection.create({
        data: {
          courseId,
          semesterId,
          sectionCode,
          room,
          dayOfWeek,
          timeStart: parseTime(ts),
          timeEnd: parseTime(te),
          maxCapacity,
        },
        select: { id: true },
      })
      if (lecturerId) {
        await tx.teachingAssignment.create({
          data: { lecturerId, courseSectionId: section.id },
        })
      }
    })
  } catch (err) {
    if (isUniqueViolation(err)) {
      return {
        error:
          'A section with that code already exists for this course in the selected semester',
      }
    }
    throw err
  }

  revalidatePath('/admin/sections')
  revalidatePath('/admin')
  return { success: true }
}

// ─── adminUpdateSection ────────────────────────────────────────────────────────

export async function adminUpdateSection(
  sectionId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertAdmin()

  const parsedId = sectionIdSchema.safeParse(sectionId)
  if (!parsedId.success) return { error: 'Invalid section ID' }

  const parsed = updateFormSchema.safeParse({
    courseId: formData.get('courseId'),
    semesterId: formData.get('semesterId'),
    sectionCode: formData.get('sectionCode'),
    room: formData.get('room'),
    dayOfWeek: formData.get('dayOfWeek'),
    timeStart: formData.get('timeStart'),
    timeEnd: formData.get('timeEnd'),
    maxCapacity: formData.get('maxCapacity'),
    lecturerId: formData.get('lecturerId'),
    isActive: formData.get('isActive'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const {
    courseId,
    semesterId,
    sectionCode,
    room,
    dayOfWeek,
    timeStart: ts,
    timeEnd: te,
    maxCapacity,
    lecturerId,
    isActive,
  } = parsed.data

  // Cross-field: end time must be after start time
  if (te <= ts) return { error: 'End time must be after start time' }

  // FK existence
  const [course, semester] = await Promise.all([
    prisma.course.findUnique({ where: { id: courseId }, select: { id: true } }),
    prisma.semester.findUnique({ where: { id: semesterId }, select: { id: true } }),
  ])
  if (!course) return { error: 'Course not found' }
  if (!semester) return { error: 'Semester not found' }

  if (lecturerId) {
    const lecturerCheck = await assertAssignableLecturer(lecturerId)
    if ('error' in lecturerCheck) return { error: lecturerCheck.error }
  }

  // Fetch current state for no-op detection
  const existing = await prisma.courseSection.findUnique({
    where: { id: parsedId.data },
    select: {
      courseId: true,
      semesterId: true,
      sectionCode: true,
      room: true,
      dayOfWeek: true,
      timeStart: true,
      timeEnd: true,
      maxCapacity: true,
      isActive: true,
      teachingAssignments: {
        select: { lecturerId: true },
        orderBy: { assignedAt: 'asc' },
        take: 1,
      },
    },
  })
  if (!existing) return { error: 'Section not found' }

  const existingTimeStart = (existing.timeStart as Date).toISOString().slice(11, 16)
  const existingTimeEnd = (existing.timeEnd as Date).toISOString().slice(11, 16)
  const existingLecturerId = existing.teachingAssignments[0]?.lecturerId ?? null

  const sectionChanged =
    courseId !== existing.courseId ||
    semesterId !== existing.semesterId ||
    sectionCode !== existing.sectionCode ||
    room !== existing.room ||
    dayOfWeek !== existing.dayOfWeek ||
    ts !== existingTimeStart ||
    te !== existingTimeEnd ||
    maxCapacity !== existing.maxCapacity ||
    isActive !== existing.isActive

  const lecturerChanged = lecturerId !== existingLecturerId

  // No-op: nothing changed — skip DB write entirely
  if (!sectionChanged && !lecturerChanged) return { success: true }

  try {
    await prisma.$transaction(async (tx) => {
      if (sectionChanged) {
        await tx.courseSection.update({
          where: { id: parsedId.data },
          data: {
            courseId,
            semesterId,
            sectionCode,
            room,
            dayOfWeek,
            timeStart: parseTime(ts),
            timeEnd: parseTime(te),
            maxCapacity,
            isActive,
          },
        })
      }
      if (lecturerChanged) {
        // Replace all TAs atomically: delete existing, then create the new one (if any).
        // deleteMany before create ensures no duplicate-TA unique-constraint race.
        await tx.teachingAssignment.deleteMany({
          where: { courseSectionId: parsedId.data },
        })
        if (lecturerId) {
          await tx.teachingAssignment.create({
            data: { lecturerId, courseSectionId: parsedId.data },
          })
        }
      }
    })
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { error: 'Section code already in use for this course in the selected semester' }
    }
    if (isNotFoundError(err)) return { error: 'Section not found' }
    throw err
  }

  revalidatePath('/admin/sections')
  revalidatePath('/admin')
  // Lecturer reassignment affects lecturer dashboard + timetable which are server components
  revalidatePath('/lecturer')
  return { success: true }
}
