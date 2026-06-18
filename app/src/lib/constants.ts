// Application-wide constants

export const APP_NAME = 'UCSI Student Portal'
export const UCSI_RED = '#C1272D'

// Resource type display labels
export const RESOURCE_TYPE_LABELS: Record<string, string> = {
  slide: 'Slides',
  tutorial: 'Tutorial',
  exercise: 'Exercise',
  assignment: 'Assignment',
  recording: 'Recording',
  announcement: 'Announcement',
  other: 'Other',
}

// Invoice status display labels
export const INVOICE_STATUS_LABELS: Record<string, string> = {
  unpaid: 'Unpaid',
  partial: 'Partial',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
}

// Feedback status display labels
export const FEEDBACK_STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  resolved: 'Resolved',
  closed: 'Closed',
}

// Max file upload size in bytes (100MB)
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024

// Allowed MIME types for resource uploads
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'video/webm',
  'image/jpeg',
  'image/png',
  'application/zip',
]
