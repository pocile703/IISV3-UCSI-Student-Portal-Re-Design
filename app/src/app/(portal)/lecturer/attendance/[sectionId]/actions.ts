'use server'

// Phase 6: Attendance save mutation.
//
// Authorization layers:
//   Lecturer: TeachingAssignment gate (must be assigned to the section).
//   Admin:    Section-exists gate only — no TeachingAssignment required.
//
// Duplicate prevention: @@unique([studentId, courseSectionId, date]) + upsert — re-saves overwrite.
// Date validation: submitted date must fall within the section's semester bounds.
//
// CRITICAL identifier: recordedBy → User.id → use session.user.id (NOT session.user.lecturerId).
// Attendance.recordedBy FK references User, not Lecturer. Passing Lecturer.id fails at DB layer.

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getValidatedSession } from '@/lib/session-guard'
import { attendanceStatusSchema, sectionIdSchema, studentIdSchema } from '@/lib/schemas'
import type { AttendanceStatus } from '@prisma/client'

export type AttendanceState = { error?: string; success?: boolean }

const entrySchema = z.object({
  // Lenient UUID regex — seed deterministic IDs fail z.string().uuid() in Zod v4.
  studentId: studentIdSchema,
  status: attendanceStatusSchema,
})

const saveAttendanceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  entries: z.array(entrySchema).min(1, 'At least one attendance entry is required'),
})

function parseDateOnly(value: string): Date | null {
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10) === value ? parsed : null
}

function toUtcDateOnly(value: Date): Date {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  )
}

// Bound by the page: saveAttendance.bind(null, sectionId)
// sectionId is server-side — never sourced from formData.
export async function saveAttendance(
  sectionId: string,
  _prev: AttendanceState,
  formData: FormData,
): Promise<AttendanceState> {
  // Validate sectionId before any DB call (lenient UUID — matches seed deterministic IDs).
  const parsedSection = sectionIdSchema.safeParse(sectionId)
  if (!parsedSection.success) return { error: 'Invalid section ID' }
  const validSectionId = parsedSection.data

  const session = await getValidatedSession()
  const isAdmin = session.user.role === 'admin'
  const lecturerId = session.user.lecturerId
  // M5: explicit role check — getValidatedSession() validates session but NOT role.
  if (!isAdmin && (!lecturerId || session.user.role !== 'lecturer')) redirect('/login')

  // Fetch semester bounds.
  // Admin: bypass TeachingAssignment — query section directly.
  // Lecturer: Gate 1 — verify TeachingAssignment exists for this lecturer+section pair.
  let semesterBounds: { startDate: Date; endDate: Date }

  if (isAdmin) {
    const cs = await prisma.courseSection.findUnique({
      where: { id: validSectionId },
      select: { semester: { select: { startDate: true, endDate: true } } },
    })
    if (!cs) return { error: 'Section not found' }
    semesterBounds = cs.semester
  } else {
    const assignment = await prisma.teachingAssignment.findUnique({
      where: {
        lecturerId_courseSectionId: { lecturerId: lecturerId!, courseSectionId: validSectionId },
      },
      select: {
        courseSection: { select: { semester: { select: { startDate: true, endDate: true } } } },
      },
    })
    if (!assignment) redirect('/lecturer/attendance')
    semesterBounds = assignment.courseSection.semester
  }

  // Parse + validate form payload.
  let parsedEntries: unknown
  try {
    parsedEntries = JSON.parse((formData.get('entries') as string | null) ?? '[]')
  } catch {
    return { error: 'Invalid entries format' }
  }

  const parsed = saveAttendanceSchema.safeParse({
    date: formData.get('date'),
    entries: parsedEntries,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const { date, entries } = parsed.data
  const attendanceDate = parseDateOnly(date)
  if (!attendanceDate) return { error: 'Invalid attendance date' }

  const studentIds = entries.map(({ studentId }) => studentId)
  if (new Set(studentIds).size !== studentIds.length) {
    return { error: 'Duplicate student entries are not allowed' }
  }

  // Validate date falls within the section's semester bounds.
  const { startDate, endDate } = semesterBounds
  const start = toUtcDateOnly(startDate as Date)
  const end = toUtcDateOnly(endDate as Date)
  if (attendanceDate < start || attendanceDate > end) {
    return {
      error: `Date ${date} is outside the semester (${start.toISOString().split('T')[0]} – ${end.toISOString().split('T')[0]})`,
    }
  }

  const enrolledStudents = await prisma.studentSectionEnrollment.findMany({
    where: {
      courseSectionId: validSectionId,
      status: 'ENROLLED',
      studentId: { in: studentIds },
    },
    select: { studentId: true },
  })
  if (enrolledStudents.length !== studentIds.length) {
    return { error: 'Invalid or unauthorized student selection' }
  }

  // Upsert all entries in a single transaction.
  // @@unique([studentId, courseSectionId, date]) makes upsert idempotent — re-saves overwrite.
  // recordedBy → User.id (session.user.id), NOT Lecturer.id (session.user.lecturerId).
  await prisma.$transaction(
    entries.map(({ studentId, status }) =>
      prisma.attendance.upsert({
        where: {
          studentId_courseSectionId_date: {
            studentId,
            courseSectionId: validSectionId,
            date: attendanceDate,
          },
        },
        create: {
          studentId,
          courseSectionId: validSectionId,
          date: attendanceDate,
          status: status.toUpperCase() as AttendanceStatus,
          recordedBy: session.user.id, // User.id — do NOT substitute lecturerId here
        },
        update: {
          status: status.toUpperCase() as AttendanceStatus,
          recordedBy: session.user.id,
        },
      }),
    ),
  )

  // Revalidate the detail page and the picker (pending counts change after a save).
  revalidatePath(`/lecturer/attendance/${validSectionId}`)
  revalidatePath('/lecturer/attendance')
  return { success: true }
}
