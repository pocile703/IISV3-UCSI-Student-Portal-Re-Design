// Mock student data for placeholder UI development (no real DB yet)

import type { Student, ProgrammeEnrollment } from '@/types/student'
import type { Semester } from '@/types/academic'

export const mockStudent: Student = {
  id: 'stu-001',
  userId: 'usr-001',
  studentNumber: 'UCSI-2022-001',
  fullName: 'Ahmad Hafizi bin Razali',
  dateOfBirth: '2002-03-15',
  gender: 'male',
  nationality: 'Malaysia',
  mobile: '0123456789',
  guardianName: 'Razali bin Hassan',
  guardianRelation: 'Father',
  addressLine1: '12, Jalan Bukit 2/3',
  city: 'Cheras',
  state: 'Selangor',
  postcode: '56000',
  country: 'Malaysia',
  thecnUsername: 'SE690',
}

export const mockProgrammeEnrollment: ProgrammeEnrollment = {
  id: 'pe-001',
  studentId: 'stu-001',
  programmeId: 'prog-001',
  fileNumber: 'DIT-2022-001',
  intakeDate: '2022-09-01',
  expectedGradDate: '2025-08-31',
  status: 'active',
}

export const mockSemesters: Semester[] = [
  { id: 'sem-1', programmeId: 'prog-001', name: 'Semester 1 2022/23', academicYear: 2022, semesterNumber: 1, startDate: '2022-09-01', endDate: '2023-01-31', isCurrent: false },
  { id: 'sem-2', programmeId: 'prog-001', name: 'Semester 2 2022/23', academicYear: 2022, semesterNumber: 2, startDate: '2023-03-01', endDate: '2023-07-31', isCurrent: false },
  { id: 'sem-3', programmeId: 'prog-001', name: 'Semester 1 2023/24', academicYear: 2023, semesterNumber: 1, startDate: '2023-09-01', endDate: '2024-01-31', isCurrent: true },
]
