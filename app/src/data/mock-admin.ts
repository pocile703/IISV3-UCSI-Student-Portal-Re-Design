// Admin-level mock data — aggregates, activity feed, lecturer roster, profile

export interface AdminActivityItem {
  id: string
  type: 'post' | 'resource' | 'user'
  title: string
  detail: string
  actor: string
  timestamp: string
}

export interface MockProgramme {
  id: string
  code: string
  name: string
  totalStudents: number
  totalSections: number
  status: 'active' | 'inactive'
  lecturerIds: string[]           // keys into MOCK_ALL_LECTURERS
}

// Section enrollment counts visible to admin
export const MOCK_SECTION_ENROLLMENT: Record<string, number> = {
  'sec-001': 28,
  'sec-002': 24,
  'sec-003': 22,
  'sec-004': 18,
}

// Teaching assignments: lecturerId → assigned sectionIds (Phase 3 static; replaced by TeachingAssignment table in Phase 4)
export const MOCK_TEACHING_ASSIGNMENTS: Record<string, string[]> = {
  'lec-001': ['sec-001'],
  'lec-002': ['sec-002'],
  'lec-003': ['sec-003', 'sec-004'],
  'lec-004': [],
  'lec-005': ['sec-001', 'sec-003'],
}

// Full lecturer roster (includes lec-005 not present in mock-posts MOCK_LECTURER_NAMES)
export const MOCK_ALL_LECTURERS: Record<string, { name: string; staffId: string }> = {
  'lec-001': { name: 'Dr. Amirul Hassan',   staffId: 'UCSI/STF/2015/001' },
  'lec-002': { name: 'Ms. Siti Norzahra',   staffId: 'UCSI/STF/2019/002' },
  'lec-003': { name: 'Mr. Khairul Azwan',   staffId: 'UCSI/STF/2017/003' },
  'lec-004': { name: 'Mr. Rashid Bin Ahmad', staffId: 'UCSI/STF/2020/004' },
  'lec-005': { name: 'Dr. Sarah Tan',       staffId: 'UCSI/STF/2018/005' },
}

export const MOCK_PROGRAMMES: MockProgramme[] = [
  {
    id: 'prog-001',
    code: 'DIT',
    name: 'Diploma in Information Technology',
    totalStudents: 82,
    totalSections: 12,
    status: 'active',
    lecturerIds: ['lec-001', 'lec-003', 'lec-005'],
  },
  {
    id: 'prog-002',
    code: 'DBM',
    name: 'Diploma in Business Management',
    totalStudents: 38,
    totalSections: 6,
    status: 'active',
    lecturerIds: ['lec-002'],
  },
  {
    id: 'prog-003',
    code: 'DAC',
    name: 'Diploma in Accounting',
    totalStudents: 22,
    totalSections: 4,
    status: 'active',
    lecturerIds: ['lec-004'],
  },
]

export const MOCK_ADMIN_STATS = {
  totalStudents:   142,
  totalLecturers:  Object.keys(MOCK_ALL_LECTURERS).length,
  totalProgrammes: MOCK_PROGRAMMES.length,
  totalSections:   4,
}

export const MOCK_ADMIN_ACTIVITY: AdminActivityItem[] = [
  {
    id: 'act-001',
    type: 'post',
    title: 'Urgent post published',
    detail: 'DIT7044 · Sec A — Class Cancelled Week 5',
    actor: 'Dr. Amirul Hassan',
    timestamp: '2023-10-09T08:30:00Z',
  },
  {
    id: 'act-002',
    type: 'resource',
    title: 'Resource published',
    detail: 'DIT7044 · Week 4 Interaction Design Patterns',
    actor: 'Dr. Sarah Tan',
    timestamp: '2023-09-26T10:00:00Z',
  },
  {
    id: 'act-003',
    type: 'post',
    title: 'Urgent post published',
    detail: 'DIT7031 · Sec A — Lab Computers Unavailable',
    actor: 'Mr. Khairul Azwan',
    timestamp: '2023-09-21T07:45:00Z',
  },
  {
    id: 'act-004',
    type: 'resource',
    title: 'Resource published',
    detail: 'DIT7031 · JS Frameworks Overview',
    actor: 'Dr. Sarah Tan',
    timestamp: '2023-09-21T12:00:00Z',
  },
  {
    id: 'act-005',
    type: 'resource',
    title: 'Resource published',
    detail: 'DIT7031 · Lab 2 Responsive Layout Challenge',
    actor: 'Mr. Khairul Azwan',
    timestamp: '2023-09-21T11:00:00Z',
  },
  {
    id: 'act-006',
    type: 'post',
    title: 'Announcement posted',
    detail: 'DIT7021 · Sec B — Lab Moved to Lab-3',
    actor: 'Ms. Siti Norzahra',
    timestamp: '2023-09-15T11:00:00Z',
  },
]

export const MOCK_ADMIN_PROFILE = {
  name:        'Ahmad Farouk',
  staffId:     'UCSI/ADM/2020/001',
  initials:    'AF',
  designation: 'System Administrator',
  department:  'Registry & Administration',
  office:      'Admin Block, Level 2',
  email:       'admin@ucsicollege.edu.my',
  phone:       '+603-9101-8880 ext. 2001',
  dateJoined:  '2020-01-15',
}

// ─── User management mock data ───────────────────────────────────────────────

export type UserStatus = 'active' | 'inactive'

export interface MockStudentUser {
  id: string
  role: 'student'
  studentNumber: string
  name: string
  email: string
  programme: 'DIT' | 'DBM' | 'DAC'
  sectionId: string
  intakeDate: string
  status: UserStatus
}

export interface MockLecturerUser {
  id: string
  role: 'lecturer'
  staffId: string
  name: string
  email: string
  department: 'IT' | 'Business' | 'Accounting'
  sectionIds: string[]
  joinedDate: string
  status: UserStatus
}

export type MockUser = MockStudentUser | MockLecturerUser

export const MOCK_ADMIN_USERS: MockUser[] = [
  // Students — 7 active, 1 inactive
  { id: 'usr-stu-001', role: 'student', studentNumber: 'UCSI-2022-001', name: 'Ahmad Hafizi bin Razali',    email: 'ahmad.hafizi@student.ucsicollege.edu.my',  programme: 'DIT', sectionId: 'sec-001', intakeDate: '2022-09-01', status: 'active'   },
  { id: 'usr-stu-002', role: 'student', studentNumber: 'UCSI-2022-002', name: 'Nurul Ain binti Hamid',      email: 'nurul.ain@student.ucsicollege.edu.my',      programme: 'DIT', sectionId: 'sec-001', intakeDate: '2022-09-01', status: 'active'   },
  { id: 'usr-stu-003', role: 'student', studentNumber: 'UCSI-2022-003', name: 'Lee Wei Kang',               email: 'lee.weikang@student.ucsicollege.edu.my',    programme: 'DIT', sectionId: 'sec-003', intakeDate: '2022-09-01', status: 'active'   },
  { id: 'usr-stu-004', role: 'student', studentNumber: 'UCSI-2022-004', name: 'Priya a/p Krishnan',         email: 'priya.krishnan@student.ucsicollege.edu.my', programme: 'DBM', sectionId: 'sec-002', intakeDate: '2022-09-01', status: 'active'   },
  { id: 'usr-stu-005', role: 'student', studentNumber: 'UCSI-2022-005', name: 'Muhammad Izzat Hakimi',      email: 'izzat.hakimi@student.ucsicollege.edu.my',   programme: 'DBM', sectionId: 'sec-002', intakeDate: '2022-09-01', status: 'active'   },
  { id: 'usr-stu-006', role: 'student', studentNumber: 'UCSI-2022-006', name: 'Siti Hajar binti Zulkifli', email: 'siti.hajar@student.ucsicollege.edu.my',     programme: 'DAC', sectionId: 'sec-004', intakeDate: '2022-09-01', status: 'active'   },
  { id: 'usr-stu-007', role: 'student', studentNumber: 'UCSI-2022-007', name: 'Tan Jia Hui',               email: 'tan.jiahui@student.ucsicollege.edu.my',     programme: 'DIT', sectionId: 'sec-003', intakeDate: '2022-09-01', status: 'active'   },
  { id: 'usr-stu-008', role: 'student', studentNumber: 'UCSI-2022-008', name: 'Farah Nabilah binti Rosli', email: 'farah.nabilah@student.ucsicollege.edu.my',  programme: 'DIT', sectionId: 'sec-001', intakeDate: '2022-09-01', status: 'inactive' },
  // Lecturers — 4 active, 1 inactive. Names/staffIds match MOCK_ALL_LECTURERS.
  { id: 'usr-lec-001', role: 'lecturer', staffId: 'UCSI/STF/2015/001', name: 'Dr. Amirul Hassan',    email: 'amirul.hassan@ucsicollege.edu.my',  department: 'IT',         sectionIds: ['sec-001'],            joinedDate: '2015-08-01', status: 'active'   },
  { id: 'usr-lec-002', role: 'lecturer', staffId: 'UCSI/STF/2019/002', name: 'Ms. Siti Norzahra',    email: 'siti.norzahra@ucsicollege.edu.my',  department: 'Business',   sectionIds: ['sec-002'],            joinedDate: '2019-03-01', status: 'active'   },
  { id: 'usr-lec-003', role: 'lecturer', staffId: 'UCSI/STF/2017/003', name: 'Mr. Khairul Azwan',    email: 'khairul.azwan@ucsicollege.edu.my',  department: 'IT',         sectionIds: ['sec-003', 'sec-004'], joinedDate: '2017-06-01', status: 'active'   },
  { id: 'usr-lec-004', role: 'lecturer', staffId: 'UCSI/STF/2020/004', name: 'Mr. Rashid Bin Ahmad', email: 'rashid.ahmad@ucsicollege.edu.my',   department: 'Accounting', sectionIds: [],                     joinedDate: '2020-01-01', status: 'inactive' },
  { id: 'usr-lec-005', role: 'lecturer', staffId: 'UCSI/STF/2018/005', name: 'Dr. Sarah Tan',        email: 'sarah.tan@ucsicollege.edu.my',      department: 'IT',         sectionIds: ['sec-001', 'sec-003'], joinedDate: '2018-09-01', status: 'active'   },
]

// Derived from MOCK_ADMIN_USERS — update if user list changes
export const MOCK_USER_STATS = {
  totalStudents:  8,   // all students in MOCK_ADMIN_USERS
  totalLecturers: 5,   // all lecturers in MOCK_ADMIN_USERS
  totalActive:    11,  // 7 active students + 4 active lecturers
  totalInactive:  2,   // 1 inactive student + 1 inactive lecturer
}
