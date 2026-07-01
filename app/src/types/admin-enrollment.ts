// View-model types for the admin "Manage students" (section enrollment) modal.

export type EnrollmentStudent = {
  studentId: string
  fullName: string
  studentNumber: string
}

export type SectionEnrollmentData = {
  sectionId: string
  courseCode: string
  courseTitle: string
  sectionCode: string
  maxCapacity: number
  enrolledCount: number
  // Students currently ENROLLED in this section.
  enrolled: EnrollmentStudent[]
  // Same-programme students not currently ENROLLED — eligible to be added.
  eligible: EnrollmentStudent[]
}
