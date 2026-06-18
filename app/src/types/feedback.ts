// Feedback and workflow types

export type FeedbackStatus = 'submitted' | 'under_review' | 'resolved' | 'closed'

export interface Feedback {
  id: string
  studentId: string
  subject: string
  body: string
  status: FeedbackStatus
  createdAt: string
  resolvedAt?: string
}

export type AddDropAction = 'add' | 'drop'
export type RequestStatus = 'pending' | 'approved' | 'rejected'

export interface AddDropRequest {
  id: string
  studentId: string
  courseSectionId: string
  action: AddDropAction
  status: RequestStatus
  reason?: string
  createdAt: string
}

export interface ProgressionRequest {
  id: string
  studentId: string
  fromSemesterId: string
  toSemesterId: string
  reason: string
  status: RequestStatus
  createdAt: string
}
