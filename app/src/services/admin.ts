// Admin API service functions
// Placeholder: endpoints are not implemented yet

import { apiFetch } from './api'

export const adminService = {
  getUsers: (params?: { role?: string; page?: number }) =>
    apiFetch(`/api/admin/users${params ? '?' + new URLSearchParams(params as Record<string, string>) : ''}`),
  createUser: (body: Record<string, unknown>) =>
    apiFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(body) }),
  updateUser: (id: string, body: Record<string, unknown>) =>
    apiFetch(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  getResources: () => apiFetch('/api/admin/resources'),
  unpublishResource: (id: string) =>
    apiFetch(`/api/admin/resources/${id}`, { method: 'PATCH', body: JSON.stringify({ isPublished: false }) }),
  deleteResource: (id: string) =>
    apiFetch(`/api/admin/resources/${id}`, { method: 'DELETE' }),
}
