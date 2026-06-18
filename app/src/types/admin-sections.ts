// View-model types for /admin/sections — scoped to what the page renders.
// SectionStats is used by admin/sections/page.tsx only (passed as prop to SectionTable).
// SectionPageRow is passed to SectionTable and SectionModal.

export type SectionPageRow = {
  id: string
  sectionCode: string         // "A", "B", etc.
  courseId: string            // needed for no-op diff in action
  courseCode: string          // "DIT7044"
  courseTitle: string         // "Human Computer Interaction"
  semesterId: string          // used for grouping + no-op diff
  semesterName: string        // "Semester 1 2023/24 (DIT)"
  room: string | null
  dayOfWeek: number           // 0 = Monday … 6 = Sunday (matches DB — NOT 1-indexed)
  timeStart: string           // "HH:MM" (formatted from @db.Time via .toISOString().slice(11,16))
  timeEnd: string             // "HH:MM"
  maxCapacity: number
  enrolledCount: number       // count of StudentSectionEnrollment WHERE status = ENROLLED
  isActive: boolean
  lecturerId: string | null   // first TeachingAssignment.lecturerId by assignedAt asc; null = unassigned
  lecturerName: string | null // corresponding Lecturer.fullName
}

export type SectionFormOption = { id: string; label: string }

export type SectionFormData = {
  courses: SectionFormOption[]    // label: "DIT7044 – Human Computer Interaction"
  semesters: SectionFormOption[]  // label: "Semester 1 2023/24 (DIT)"
  lecturers: SectionFormOption[]  // label: "Dr. Amirul Hassan"
}

export type SectionStats = {
  totalActive: number
  totalInactive: number
  totalAssignments: number   // sections with at least one TeachingAssignment
  totalSeatsUsed: number     // sum of enrolledCount across all sections
}
