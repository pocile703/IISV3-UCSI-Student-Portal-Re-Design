export const MOCK_CURRENT_LECTURER = {
  id: 'lec-005',
  name: 'Dr. Sarah Tan',
  initials: 'ST',
  role: 'lecturer' as const,
}

export const MOCK_LECTURER_SECTION_IDS: string[] = ['sec-001', 'sec-003']

export const MOCK_LECTURER_STUDENT_COUNTS: Record<string, number> = {
  'sec-001': 28,
  'sec-003': 22,
}

export interface PendingTask {
  id: string
  text: string
  context: string
  dueLabel: string
  overdue?: boolean
}

export const MOCK_LECTURER_PROFILE = {
  staffId: 'UCSI/STF/2018/003',
  fullName: 'Dr. Sarah Tan Wei Ling',
  initials: 'ST',
  designation: 'Senior Lecturer',
  department: 'School of Information Technology',
  faculty: 'Faculty of Computing & Information Technology',
  email: 'sarah.tan@ucsicollege.edu.my',
  phone: '+603-9101-8880 ext. 5234',
  office: 'Block A, Room A-412',
  dateJoined: '2018-07-01',
  qualification: 'PhD in Human-Computer Interaction, Universiti Malaya',
  specialisation: 'HCI, User Experience Design, Web Technologies',
  thecnUsername: 'SARAH.TAN',
}

export interface TeachingSession {
  sectionId: string
  courseId: string
  courseCode: string
  courseTitle: string
  sectionCode: string
  dayOfWeek: number
  timeStart: string
  timeEnd: string
  room: string
  studentCount: number
}

export const MOCK_LECTURER_TEACHING_SESSIONS: TeachingSession[] = [
  {
    sectionId: 'sec-001',
    courseId: 'crs-001',
    courseCode: 'DIT7044',
    courseTitle: 'Human Computer Interaction',
    sectionCode: 'A',
    dayOfWeek: 1,
    timeStart: '09:00',
    timeEnd: '11:00',
    room: 'A-301',
    studentCount: 28,
  },
  {
    sectionId: 'sec-003',
    courseId: 'crs-003',
    courseCode: 'DIT7031',
    courseTitle: 'Web Application Development',
    sectionCode: 'A',
    dayOfWeek: 3,
    timeStart: '10:00',
    timeEnd: '12:00',
    room: 'Lab-1',
    studentCount: 22,
  },
]

export const MOCK_PENDING_TASKS: PendingTask[] = [
  { id: 'task-001', text: 'Grade Assignment 1 submissions', context: 'HCI · DIT7044', dueLabel: 'Due tomorrow' },
  { id: 'task-002', text: 'Upload Week 4 lecture slides',   context: 'WAD · DIT7031', dueLabel: 'This week' },
  { id: 'task-003', text: 'Update attendance — Week 3',     context: 'HCI · DIT7044', dueLabel: 'Overdue', overdue: true },
  { id: 'task-004', text: 'Post mid-semester reminder',     context: 'Both sections', dueLabel: 'Next week' },
]
