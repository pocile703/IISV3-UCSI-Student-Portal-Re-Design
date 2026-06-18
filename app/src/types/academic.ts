// Academic structure types — Course, Section, Semester, Programme, and past-semester result views.
// These will map directly to Prisma models in Phase 4.

export interface Programme {
  id: string
  code: string
  name: string
  totalCredits: number
  durationYears: number
}

export interface Semester {
  id: string
  programmeId: string
  name: string
  academicYear: number
  semesterNumber: number
  startDate: string
  endDate: string
  isCurrent: boolean
}

export interface Course {
  id: string
  code: string
  title: string
  credits: number
  type: 'core' | 'elective' | 'mpw' | 'bridging'
}

export interface CourseSection {
  id: string
  courseId: string
  semesterId: string
  sectionCode: string
  room?: string
  dayOfWeek: number
  timeStart: string
  timeEnd: string
}

export interface SectionResult {
  sectionId: string
  grade: string | null
  gradePoint: number | null
  attendancePercentage: number
  standing: string
  isPublished: boolean
}

// ── Past-semester view types (used by AcademicSemesterView, sourced from mock-results in Phase 3;
//    Phase 4: derived from Result JOIN StudentSectionEnrollment JOIN CourseSection) ─────────────

export interface PastSemesterCourse {
  code: string
  title: string
  credits: number
  type: 'core' | 'elective' | 'mpw' | 'bridging'
  grade: string
  gradePoint: number
  attendancePercentage: number
  standing: string
}

export interface PastSemesterDetail {
  semesterId: string
  gpa: number
  totalCredits: number
  courses: PastSemesterCourse[]
}
