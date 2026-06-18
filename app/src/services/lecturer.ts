// Lecturer API service functions
// Placeholder: endpoints are not implemented yet

import { apiFetch, apiUpload } from './api'

export const lecturerService = {
  getSections: () => apiFetch('/api/lecturer/sections'),
  getSection: (id: string) => apiFetch(`/api/lecturer/sections/${id}`),
  getResources: (sectionId: string) => apiFetch(`/api/lecturer/resources/${sectionId}`),
  uploadResource: (sectionId: string, formData: FormData, signal?: AbortSignal) =>
    apiUpload(`/api/lecturer/resources/${sectionId}`, formData, signal),
  updateResource: (sectionId: string, resourceId: string, body: Record<string, unknown>) =>
    apiFetch(`/api/lecturer/resources/${sectionId}/${resourceId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteResource: (sectionId: string, resourceId: string) =>
    apiFetch(`/api/lecturer/resources/${sectionId}/${resourceId}`, { method: 'DELETE' }),
}
