// Student API service functions — called by TanStack Query hooks
// Placeholder: endpoints are not implemented yet

import { ApiError, apiFetch } from './api'
import type { Student } from '@/types/student'
import type { Invoice } from '@/types/financial'
import type { LearningResource } from '@/types/resource'

export const studentService = {
  getProfile: () => apiFetch<Student>('/api/student/profile'),
  getAcademic: () => apiFetch('/api/student/academic'),
  getTimetable: (semesterId?: string) => apiFetch(`/api/student/timetable${semesterId ? `?semesterId=${semesterId}` : ''}`),
  getFinancial: () => apiFetch('/api/student/financial'),
  getInvoice: (id: string) => apiFetch<Invoice>(`/api/student/financial/invoices/${id}`),
  getResources: (sectionId: string) => apiFetch<LearningResource[]>(`/api/student/classes/${sectionId}`),
  getDownloadUrl: async (sectionId: string, attachmentId: string) => {
    const res = await fetch(`/api/files/${sectionId}/${attachmentId}`)
    if (!res.ok) {
      let message = 'Download failed'
      try {
        const json = await res.json()
        message = json.error ?? message
      } catch {}
      throw new ApiError(res.status, message)
    }
    return res.blob()
  },
  getFeedback: () => apiFetch('/api/student/feedback'),
  createFeedback: (body: { subject: string; body: string }) =>
    apiFetch('/api/student/feedback', { method: 'POST', body: JSON.stringify(body) }),
}
