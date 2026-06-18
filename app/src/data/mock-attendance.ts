export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export interface StudentRoster {
  studentId: string
  studentNumber: string
  name: string
}

export interface AttendanceEntry {
  studentId: string
  status: AttendanceStatus
}

export interface AttendanceRecord {
  sectionId: string
  date: string // YYYY-MM-DD
  entries: AttendanceEntry[]
}

export const SEMESTER_START = '2023-07-10'
export const SEMESTER_END = '2023-11-17'

// Returns every ISO date string matching dayOfWeek (1=Mon…7=Sun, ISO convention)
// between startDate and endDate inclusive.
export function generateSessionDates(
  dayOfWeek: number,
  startDate: string,
  endDate: string,
): string[] {
  const dates: string[] = []
  const end = new Date(endDate + 'T00:00:00')
  const current = new Date(startDate + 'T00:00:00')
  // JS getDay(): 0=Sun, 1=Mon…6=Sat; ISO dayOfWeek: 7=Sun, 1=Mon…6=Sat
  const jsDow = dayOfWeek === 7 ? 0 : dayOfWeek
  while (current.getDay() !== jsDow) current.setDate(current.getDate() + 1)
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 7)
  }
  return dates
}

// Pre-computed for use in mock records and pages
export const MOCK_SEC001_DATES = generateSessionDates(1, SEMESTER_START, SEMESTER_END)
export const MOCK_SEC003_DATES = generateSessionDates(3, SEMESTER_START, SEMESTER_END)

export const MOCK_SECTION_STUDENTS: Record<string, StudentRoster[]> = {
  'sec-001': [
    { studentId: 'stu-001', studentNumber: '0221CS012345', name: 'Ahmad Faris bin Abdullah' },
    { studentId: 'stu-002', studentNumber: '0221CS012346', name: 'Nurul Aina binti Razali' },
    { studentId: 'stu-003', studentNumber: '0221CS012347', name: 'Tan Wei Jie' },
    { studentId: 'stu-004', studentNumber: '0221CS012348', name: 'Priya Subramaniam' },
    { studentId: 'stu-005', studentNumber: '0221CS012349', name: 'Muhammad Haziq bin Zulkifli' },
    { studentId: 'stu-006', studentNumber: '0221CS012350', name: 'Lim Hui Shan' },
    { studentId: 'stu-007', studentNumber: '0221CS012351', name: 'Kavitha a/p Krishnan' },
    { studentId: 'stu-008', studentNumber: '0221CS012352', name: 'Mohd Izzat bin Rosli' },
  ],
  'sec-003': [
    { studentId: 'stu-009', studentNumber: '0221CS012353', name: 'Chen Xin Yi' },
    { studentId: 'stu-010', studentNumber: '0221CS012354', name: 'Nur Farah binti Ismail' },
    { studentId: 'stu-011', studentNumber: '0221CS012355', name: 'Raj Kumar a/l Selvam' },
    { studentId: 'stu-012', studentNumber: '0221CS012356', name: 'Amirah binti Khairuddin' },
    { studentId: 'stu-013', studentNumber: '0221CS012357', name: 'Wong Jing Han' },
    { studentId: 'stu-014', studentNumber: '0221CS012358', name: 'Siti Norzahirah binti Othman' },
  ],
}

// ── Pre-filled records ───────────────────────────────────────────
// First 10 sessions per section are marked; remaining dates are Pending.

const s001 = MOCK_SECTION_STUDENTS['sec-001']
const s003 = MOCK_SECTION_STUDENTS['sec-003']

function makeRecord(
  sectionId: string,
  date: string,
  statuses: AttendanceStatus[],
): AttendanceRecord {
  const roster = sectionId === 'sec-001' ? s001 : s003
  return {
    sectionId,
    date,
    entries: roster.map((s, i) => ({
      studentId: s.studentId,
      status: statuses[i % statuses.length],
    })),
  }
}

// ── Student-view attendance (current logged-in student, stu-001) ─────────────
// Independent from the lecturer roster records above; represents what a student
// sees on their own timetable page.

export interface StudentAttendanceRecord {
  sectionId: string
  date: string // YYYY-MM-DD
  status: AttendanceStatus
}

export const MOCK_STUDENT_ATTENDANCE: StudentAttendanceRecord[] = [
  // sec-001 HCI (Mondays)
  { sectionId: 'sec-001', date: '2023-07-10', status: 'present'  },
  { sectionId: 'sec-001', date: '2023-07-17', status: 'present'  },
  { sectionId: 'sec-001', date: '2023-07-24', status: 'absent'   },
  { sectionId: 'sec-001', date: '2023-07-31', status: 'present'  },
  { sectionId: 'sec-001', date: '2023-08-07', status: 'late'     },
  { sectionId: 'sec-001', date: '2023-08-14', status: 'present'  },
  { sectionId: 'sec-001', date: '2023-08-21', status: 'present'  },
  { sectionId: 'sec-001', date: '2023-08-28', status: 'absent'   },
  { sectionId: 'sec-001', date: '2023-09-04', status: 'present'  },
  { sectionId: 'sec-001', date: '2023-09-11', status: 'present'  },
  // sec-002 DBMS (Tuesdays)
  { sectionId: 'sec-002', date: '2023-07-11', status: 'present'  },
  { sectionId: 'sec-002', date: '2023-07-18', status: 'absent'   },
  { sectionId: 'sec-002', date: '2023-07-25', status: 'present'  },
  { sectionId: 'sec-002', date: '2023-08-01', status: 'present'  },
  { sectionId: 'sec-002', date: '2023-08-08', status: 'present'  },
  { sectionId: 'sec-002', date: '2023-08-15', status: 'excused'  },
  { sectionId: 'sec-002', date: '2023-08-22', status: 'present'  },
  { sectionId: 'sec-002', date: '2023-08-29', status: 'present'  },
  { sectionId: 'sec-002', date: '2023-09-05', status: 'present'  },
  { sectionId: 'sec-002', date: '2023-09-12', status: 'late'     },
  // sec-003 WAD (Wednesdays)
  { sectionId: 'sec-003', date: '2023-07-12', status: 'present'  },
  { sectionId: 'sec-003', date: '2023-07-19', status: 'present'  },
  { sectionId: 'sec-003', date: '2023-07-26', status: 'present'  },
  { sectionId: 'sec-003', date: '2023-08-02', status: 'absent'   },
  { sectionId: 'sec-003', date: '2023-08-09', status: 'present'  },
  { sectionId: 'sec-003', date: '2023-08-16', status: 'present'  },
  { sectionId: 'sec-003', date: '2023-08-23', status: 'present'  },
  { sectionId: 'sec-003', date: '2023-08-30', status: 'late'     },
  { sectionId: 'sec-003', date: '2023-09-06', status: 'present'  },
  { sectionId: 'sec-003', date: '2023-09-13', status: 'present'  },
  // sec-004 BM (Thursdays)
  { sectionId: 'sec-004', date: '2023-07-13', status: 'present'  },
  { sectionId: 'sec-004', date: '2023-07-20', status: 'present'  },
  { sectionId: 'sec-004', date: '2023-07-27', status: 'absent'   },
  { sectionId: 'sec-004', date: '2023-08-03', status: 'present'  },
  { sectionId: 'sec-004', date: '2023-08-10', status: 'absent'   },
  { sectionId: 'sec-004', date: '2023-08-17', status: 'present'  },
  { sectionId: 'sec-004', date: '2023-08-24', status: 'present'  },
  { sectionId: 'sec-004', date: '2023-08-31', status: 'present'  },
  { sectionId: 'sec-004', date: '2023-09-07', status: 'present'  },
  { sectionId: 'sec-004', date: '2023-09-14', status: 'present'  },
]

export const MOCK_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  // sec-001 — first 10 Mondays
  makeRecord('sec-001', MOCK_SEC001_DATES[0], ['present','present','present','present','present','present','absent','present']),
  makeRecord('sec-001', MOCK_SEC001_DATES[1], ['present','present','late','present','present','present','present','absent']),
  makeRecord('sec-001', MOCK_SEC001_DATES[2], ['present','absent','present','present','present','late','present','present']),
  makeRecord('sec-001', MOCK_SEC001_DATES[3], ['present','present','present','excused','present','present','present','present']),
  makeRecord('sec-001', MOCK_SEC001_DATES[4], ['present','present','present','present','absent','present','late','present']),
  makeRecord('sec-001', MOCK_SEC001_DATES[5], ['present','present','present','present','present','present','present','present']),
  makeRecord('sec-001', MOCK_SEC001_DATES[6], ['late','present','present','present','present','absent','present','present']),
  makeRecord('sec-001', MOCK_SEC001_DATES[7], ['present','present','excused','present','present','present','present','absent']),
  makeRecord('sec-001', MOCK_SEC001_DATES[8], ['present','present','present','present','late','present','present','present']),
  makeRecord('sec-001', MOCK_SEC001_DATES[9], ['present','absent','present','present','present','present','present','present']),
  // sec-003 — first 10 Wednesdays
  makeRecord('sec-003', MOCK_SEC003_DATES[0], ['present','present','present','absent','present','present']),
  makeRecord('sec-003', MOCK_SEC003_DATES[1], ['present','present','late','present','present','present']),
  makeRecord('sec-003', MOCK_SEC003_DATES[2], ['present','present','present','present','absent','present']),
  makeRecord('sec-003', MOCK_SEC003_DATES[3], ['excused','present','present','present','present','present']),
  makeRecord('sec-003', MOCK_SEC003_DATES[4], ['present','present','present','late','present','absent']),
  makeRecord('sec-003', MOCK_SEC003_DATES[5], ['present','present','present','present','present','present']),
  makeRecord('sec-003', MOCK_SEC003_DATES[6], ['present','absent','present','present','late','present']),
  makeRecord('sec-003', MOCK_SEC003_DATES[7], ['present','present','present','present','present','excused']),
  makeRecord('sec-003', MOCK_SEC003_DATES[8], ['present','late','present','present','absent','present']),
  makeRecord('sec-003', MOCK_SEC003_DATES[9], ['present','present','present','present','present','present']),
]
