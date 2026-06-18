// View-model types for /admin/users — scoped to what the page renders.
// UserStats is used by admin/users/page.tsx only (not passed to UserTable).
// UserPageRow is passed to UserTable and EditUserModal.

export type UserPageRow = {
  id: string
  role: 'STUDENT' | 'LECTURER' | 'ADMIN'
  isActive: boolean
  emailInstitutional: string
  fullName: string | null          // null for ADMIN users (no Student/Lecturer profile row)
  studentNumber: string | null     // student-side; null for staff
  programmeCode: string | null     // active programme code; null for staff / unenrolled. Use active-first fallback (see profile-queries.ts pattern)
  staffNumber: string | null       // lecturer-side; null for students and bare admins
  department: string | null        // full DB name e.g. "School of Information Technology" — differs from mock-admin.ts abbreviations
  sectionCodes: string[]           // teaching section course codes; empty for students + bare admins
}

export type UserStats = {
  totalStudents: number
  totalLecturers: number   // LECTURER role only; ADMIN users are not included
  totalActive: number      // all roles
  totalInactive: number    // all roles
}
