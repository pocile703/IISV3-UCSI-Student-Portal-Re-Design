import type { Feedback } from '@/types/feedback'

export const mockFeedback: Feedback[] = [
  {
    id: 'fb-001',
    studentId: 'stu-001',
    subject: 'Library access hours',
    body: 'The library closes too early on weekends. Could the hours be extended to 10pm?',
    status: 'resolved',
    createdAt: '2023-10-02T10:00:00Z',
    resolvedAt: '2023-10-10T14:30:00Z',
  },
  {
    id: 'fb-002',
    studentId: 'stu-001',
    subject: 'Wi-Fi connectivity in Block A',
    body: 'The Wi-Fi signal in Block A Level 3 labs is very weak. It affects online submissions.',
    status: 'under_review',
    createdAt: '2023-10-18T09:15:00Z',
  },
  {
    id: 'fb-003',
    studentId: 'stu-001',
    subject: 'Request for additional HCI tutorial slots',
    body: 'Many students in Section A are struggling with Assignment 1. Could we have an extra tutorial?',
    status: 'submitted',
    createdAt: '2023-10-25T16:00:00Z',
  },
]
