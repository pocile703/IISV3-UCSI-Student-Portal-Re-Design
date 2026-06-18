// Base API client — wraps fetch with consistent error handling and envelope unwrapping
// Placeholder: will be implemented when API routes are built

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  const json = await res.json()
  if (!res.ok) throw new ApiError(res.status, json.error ?? 'Unknown error')
  return json.data as T
}

// For multipart uploads — omits Content-Type so the browser sets the multipart boundary
export async function apiUpload<T>(url: string, body: FormData, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { method: 'POST', body, signal })
  const json = await res.json()
  if (!res.ok) throw new ApiError(res.status, json.error ?? 'Upload failed')
  return json.data as T
}
