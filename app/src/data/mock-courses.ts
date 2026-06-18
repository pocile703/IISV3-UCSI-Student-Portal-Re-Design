// Mock course sections and timetable data for placeholder UI

import type { Course, CourseSection } from '@/types/academic'

export const mockCourses: Course[] = [
  { id: 'crs-001', code: 'DIT7044', title: 'Human Computer Interaction', credits: 3, type: 'core' },
  { id: 'crs-002', code: 'DIT7021', title: 'Database Management Systems', credits: 3, type: 'core' },
  { id: 'crs-003', code: 'DIT7031', title: 'Web Application Development', credits: 3, type: 'core' },
  { id: 'crs-004', code: 'MPW1143', title: 'Bahasa Malaysia Komunikasi 2', credits: 2, type: 'mpw' },
]

export const mockCourseSections: CourseSection[] = [
  { id: 'sec-001', courseId: 'crs-001', semesterId: 'sem-3', sectionCode: 'A', room: 'A-301', dayOfWeek: 1, timeStart: '09:00', timeEnd: '11:00' },
  { id: 'sec-002', courseId: 'crs-002', semesterId: 'sem-3', sectionCode: 'B', room: 'B-204', dayOfWeek: 2, timeStart: '14:00', timeEnd: '16:00' },
  { id: 'sec-003', courseId: 'crs-003', semesterId: 'sem-3', sectionCode: 'A', room: 'Lab-1', dayOfWeek: 3, timeStart: '10:00', timeEnd: '12:00' },
  { id: 'sec-004', courseId: 'crs-004', semesterId: 'sem-3', sectionCode: 'A', room: 'C-101', dayOfWeek: 4, timeStart: '08:00', timeEnd: '10:00' },
]
