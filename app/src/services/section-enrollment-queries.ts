import 'server-only'

import { prisma } from '@/lib/prisma'
import type { SectionEnrollmentData, EnrollmentStudent } from '@/types/admin-enrollment'

// Loads the roster + eligible-to-add list for a single section's "Manage students" modal.
// Eligibility = students with an ACTIVE ProgrammeEnrollment for the section's programme
// (resolved via CourseSection → Semester.programmeId), minus those already ENROLLED.
// Returns null when the section does not exist.
export async function getSectionEnrollmentData(
  sectionId: string,
): Promise<SectionEnrollmentData | null> {
  const section = await prisma.courseSection.findUnique({
    where: { id: sectionId },
    select: {
      id: true,
      sectionCode: true,
      maxCapacity: true,
      course: { select: { code: true, title: true } },
      semester: { select: { programmeId: true } },
      studentEnrollments: {
        where: { status: 'ENROLLED' },
        select: {
          student: { select: { id: true, fullName: true, studentNumber: true } },
        },
      },
    },
  })
  if (!section) return null

  const enrolled: EnrollmentStudent[] = section.studentEnrollments
    .map((e) => ({
      studentId: e.student.id,
      fullName: e.student.fullName,
      studentNumber: e.student.studentNumber,
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName))

  const enrolledIds = new Set(enrolled.map((s) => s.studentId))

  const programmeStudents = await prisma.programmeEnrollment.findMany({
    where: { programmeId: section.semester.programmeId, status: 'ACTIVE' },
    select: {
      student: { select: { id: true, fullName: true, studentNumber: true } },
    },
  })

  const eligible: EnrollmentStudent[] = programmeStudents
    .map((p) => ({
      studentId: p.student.id,
      fullName: p.student.fullName,
      studentNumber: p.student.studentNumber,
    }))
    .filter((s) => !enrolledIds.has(s.studentId))
    // A student can hold more than one ACTIVE programme enrollment row in theory — dedupe.
    .filter((s, i, arr) => arr.findIndex((x) => x.studentId === s.studentId) === i)
    .sort((a, b) => a.fullName.localeCompare(b.fullName))

  return {
    sectionId: section.id,
    courseCode: section.course.code,
    courseTitle: section.course.title,
    sectionCode: section.sectionCode,
    maxCapacity: section.maxCapacity,
    enrolledCount: enrolled.length,
    enrolled,
    eligible,
  }
}
