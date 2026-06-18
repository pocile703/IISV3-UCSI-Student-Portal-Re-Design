// Mock academic results for current semester sections
// PastSemesterCourse and PastSemesterDetail types live in types/academic.ts

import type { PastSemesterCourse, PastSemesterDetail, SectionResult } from '@/types/academic'
export type { PastSemesterCourse, PastSemesterDetail, SectionResult }

export const mockResults: SectionResult[] = [
  { sectionId: 'sec-001', grade: 'A',  gradePoint: 4.0, attendancePercentage: 92, standing: 'Pass',        isPublished: true  },
  { sectionId: 'sec-002', grade: 'B+', gradePoint: 3.5, attendancePercentage: 88, standing: 'Pass',        isPublished: true  },
  { sectionId: 'sec-003', grade: null, gradePoint: null, attendancePercentage: 85, standing: 'In Progress', isPublished: false },
  { sectionId: 'sec-004', grade: null, gradePoint: null, attendancePercentage: 78, standing: 'In Progress', isPublished: false },
]

export const mockCGPA = 3.75
export const mockPreviousCGPA = 3.62

// ── Past semester detail (for semester picker on academic page) ──────────────

export const MOCK_PAST_SEMESTER_DATA: PastSemesterDetail[] = [
  {
    semesterId: 'sem-1',
    gpa: 3.60,
    totalCredits: 13,
    courses: [
      { code: 'DIT1013', title: 'Computer Fundamentals',     credits: 3, type: 'core', grade: 'A',  gradePoint: 4.0, attendancePercentage: 95, standing: 'Pass' },
      { code: 'DIT1023', title: 'Introduction to Programming', credits: 3, type: 'core', grade: 'B+', gradePoint: 3.5, attendancePercentage: 90, standing: 'Pass' },
      { code: 'DIT1033', title: 'Mathematics for Computing', credits: 3, type: 'core', grade: 'A-', gradePoint: 3.7, attendancePercentage: 88, standing: 'Pass' },
      { code: 'DIT1043', title: 'Introduction to IT',         credits: 2, type: 'core', grade: 'A',  gradePoint: 4.0, attendancePercentage: 92, standing: 'Pass' },
      { code: 'MPW1133', title: 'Bahasa Malaysia Komunikasi 1', credits: 2, type: 'mpw', grade: 'B+', gradePoint: 3.5, attendancePercentage: 85, standing: 'Pass' },
    ],
  },
  {
    semesterId: 'sem-2',
    gpa: 3.50,
    totalCredits: 14,
    courses: [
      { code: 'DIT2013', title: 'Object-Oriented Programming', credits: 3, type: 'core', grade: 'B+', gradePoint: 3.5, attendancePercentage: 87, standing: 'Pass' },
      { code: 'DIT2023', title: 'Computer Networks',           credits: 3, type: 'core', grade: 'A-', gradePoint: 3.7, attendancePercentage: 90, standing: 'Pass' },
      { code: 'DIT2033', title: 'System Analysis & Design',    credits: 3, type: 'core', grade: 'B',  gradePoint: 3.0, attendancePercentage: 82, standing: 'Pass' },
      { code: 'DIT2043', title: 'Statistics for IT',           credits: 3, type: 'core', grade: 'A',  gradePoint: 4.0, attendancePercentage: 93, standing: 'Pass' },
      { code: 'MPW2143', title: 'English Communication',       credits: 2, type: 'mpw', grade: 'B+', gradePoint: 3.5, attendancePercentage: 88, standing: 'Pass' },
    ],
  },
]
