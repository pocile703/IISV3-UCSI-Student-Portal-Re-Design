// Student profile and enrollment types.
// Academic structure types (Course, CourseSection, Semester, Programme) live in types/academic.ts.

export interface Student {
  id: string
  userId: string
  studentNumber: string
  fullName: string
  dateOfBirth?: string
  gender?: string
  nationality?: string
  mobile?: string
  guardianName?: string
  guardianRelation?: string
  addressLine1?: string
  city?: string
  state?: string
  postcode?: string
  country?: string
  avatarUrl?: string
  thecnUsername?: string
}

export interface ProgrammeEnrollment {
  id: string
  studentId: string
  programmeId: string
  fileNumber: string
  intakeDate: string
  expectedGradDate: string
  status: 'active' | 'completed' | 'withdrawn' | 'deferred'
}

export interface Result {
  id: string
  grade: string
  standing: string
  attendancePercentage: number
  isPublished: boolean
}
