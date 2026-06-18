export type ProgrammePageRow = {
  id: string
  code: string
  name: string
  totalCredits: number
  durationYears: number
  isActive: boolean
  studentCount: number    // count of programmeEnrollments
  sectionCount: number    // sum of courseSections across all semesters
  lecturerNames: string[] // unique fullNames via teachingAssignments
}
