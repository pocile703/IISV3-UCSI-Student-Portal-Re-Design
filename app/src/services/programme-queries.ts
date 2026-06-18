import { prisma } from '@/lib/prisma'
import type { ProgrammePageRow } from '@/types/admin-programmes'

export async function getProgrammesData(): Promise<ProgrammePageRow[]> {
  const programmes = await prisma.programme.findMany({
    orderBy: { code: 'asc' },
    select: {
      id: true,
      code: true,
      name: true,
      totalCredits: true,
      durationYears: true,
      isActive: true,
      _count: { select: { programmeEnrollments: true } },
      semesters: {
        select: {
          courseSections: {
            select: {
              teachingAssignments: {
                select: {
                  lecturer: { select: { id: true, fullName: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  return programmes.map(p => {
    const allSections = p.semesters.flatMap(s => s.courseSections)

    // Deduplicate lecturers by id — a lecturer may teach multiple sections
    const lecturerMap = new Map<string, string>()
    for (const section of allSections) {
      for (const ta of section.teachingAssignments) {
        lecturerMap.set(ta.lecturer.id, ta.lecturer.fullName)
      }
    }

    return {
      id: p.id,
      code: p.code,
      name: p.name,
      totalCredits: p.totalCredits,
      durationYears: p.durationYears,
      isActive: p.isActive,
      studentCount: p._count.programmeEnrollments,
      sectionCount: allSections.length,
      lecturerNames: [...lecturerMap.values()],
    }
  })
}
