// View-model types for the student Profile page (/profile).
// These are page-scoped types — narrowed to exactly what the page renders.
// Canonical Student / ProgrammeEnrollment types remain in types/student.ts.

export type ProfileEnrollmentStatus = 'active' | 'completed' | 'withdrawn' | 'deferred'

export interface ProfileEnrollment {
  fileNumber: string
  intakeDate: string         // "YYYY-MM-DD"
  expectedGradDate: string   // "YYYY-MM-DD"
  status: ProfileEnrollmentStatus
  programmeName: string
  programmeCode: string
}

export interface ProfilePageData {
  fullName: string
  studentNumber: string
  dateOfBirth: string        // "YYYY-MM-DD" — @db.Date converted in service
  gender: string             // lowercase: 'male' | 'female' | 'other'
  nationality: string
  mobile: string
  guardianName: string
  guardianRelation: string
  addressLine1: string
  addressLine2?: string      // optional in schema; rendered when present
  city: string
  state: string
  postcode: string
  country: string
  thecnUsername?: string
  enrollment: ProfileEnrollment | null
}
