import type { ClassPost } from '@/types/post'

export const mockClassPosts: ClassPost[] = [
  // ── sec-001: HCI (DIT7044) ──────────────────────────────────────
  {
    id: 'post-001',
    courseSectionId: 'sec-001',
    authorId: 'lec-001',
    title: 'Class Cancelled – Week 5 (12 Oct)',
    body: 'No class this Thursday due to public holiday. Assignment 1 submission deadline is moved to 19 Oct. Please review the updated brief under Resources.',
    type: 'urgent',
    isPinned: true,
    isPublished: true,
    createdAt: '2023-10-09T08:30:00Z',
  },
  {
    id: 'post-002',
    courseSectionId: 'sec-001',
    authorId: 'lec-001',
    title: 'Assignment 1 Reminder – Due This Friday',
    body: 'Reminder: Assignment 1 (Persona & User Journey Map) is due this Friday 22 Sep before midnight. Submit via the Student Portal. No extensions will be granted.',
    type: 'reminder',
    isPinned: false,
    isPublished: true,
    createdAt: '2023-09-18T09:00:00Z',
  },
  {
    id: 'post-003',
    courseSectionId: 'sec-001',
    authorId: 'lec-001',
    title: 'Tutorial 2 Materials Now Available',
    body: 'Slides and worksheet for Tutorial 2 (Usability Evaluation) have been uploaded under Resources. Please review the materials before Thursday\'s session.',
    type: 'update',
    isPinned: false,
    isPublished: true,
    createdAt: '2023-09-19T16:00:00Z',
  },

  // ── sec-002: DBMS (DIT7021) ─────────────────────────────────────
  {
    id: 'post-004',
    courseSectionId: 'sec-002',
    authorId: 'lec-002',
    title: 'Assignment 1 Deadline Extended to 24 Sep',
    body: 'Due to the lab venue change last week, Assignment 1 (ER Diagram Design) deadline is extended to Sunday 24 Sep, 11:59 PM. No further extensions after this.',
    type: 'update',
    isPinned: false,
    isPublished: true,
    createdAt: '2023-09-16T14:00:00Z',
  },
  {
    id: 'post-005',
    courseSectionId: 'sec-002',
    authorId: 'lec-002',
    title: 'Week 3 Lab Moved to Lab-3',
    body: 'Week 3 lab session is relocated from B-204 to Lab-3 due to scheduled maintenance. Same time slot applies. Please be on time.',
    type: 'announcement',
    isPinned: false,
    isPublished: true,
    createdAt: '2023-09-15T11:00:00Z',
  },

  // ── sec-003: WAD (DIT7031) ──────────────────────────────────────
  {
    id: 'post-006',
    courseSectionId: 'sec-003',
    authorId: 'lec-003',
    title: 'Emergency: Lab Computers Unavailable – Bring Laptop',
    body: 'Lab-1 computers are down today. Please bring your own laptop. Lab files have been shared via the link emailed this morning. Contact me immediately if you cannot access.',
    type: 'urgent',
    isPinned: true,
    isPublished: true,
    createdAt: '2023-09-21T07:45:00Z',
  },
  {
    id: 'post-007',
    courseSectionId: 'sec-003',
    authorId: 'lec-003',
    title: 'Welcome to Web Application Development',
    body: 'Welcome to WAD! Lab 1 brief and marking rubric are now available under Resources. Please read through before our first session. Looking forward to a great semester.',
    type: 'announcement',
    isPinned: false,
    isPublished: true,
    createdAt: '2023-09-07T10:00:00Z',
  },

  // ── sec-001: HCI — lec-005 ──────────────────────────────────────
  {
    id: 'post-008',
    courseSectionId: 'sec-001',
    authorId: 'lec-005',
    title: 'Mid-Semester Feedback Form Now Open',
    body: 'Please take 5 minutes to complete the anonymous mid-semester feedback form. Your input helps improve the course. The form closes on Sunday 24 Sep.',
    type: 'announcement' as const,
    isPinned: false,
    isPublished: true,
    createdAt: '2023-09-20T09:00:00Z',
  },

  // ── sec-003: WAD — lec-005 ──────────────────────────────────────
  {
    id: 'post-009',
    courseSectionId: 'sec-003',
    authorId: 'lec-005',
    title: 'Assignment 1 Submission Instructions',
    body: 'Submit your Assignment 1 ZIP file via the Student Portal under Classes > WAD > Resources. Name your file: StudentID_WAD_A1.zip. Late submissions will not be accepted.',
    type: 'reminder' as const,
    isPinned: false,
    isPublished: true,
    createdAt: '2023-09-19T11:00:00Z',
  },
]

export const MOCK_LECTURER_NAMES: Record<string, string> = {
  'lec-001': 'Dr. Amirul Hassan',
  'lec-002': 'Ms. Siti Norzahra',
  'lec-003': 'Mr. Khairul Azwan',
  'lec-004': 'Mr. Rashid Bin Ahmad',
}

export const MOCK_SECTION_LECTURER_IDS: Record<string, string> = {
  'sec-001': 'lec-001',
  'sec-002': 'lec-002',
  'sec-003': 'lec-003',
  'sec-004': 'lec-004',
}
