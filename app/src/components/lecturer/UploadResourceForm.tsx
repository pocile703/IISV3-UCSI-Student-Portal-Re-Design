'use client'
import { useState } from 'react'
import type { ResourceType } from '@/types/resource'

const RESOURCE_TYPES: { value: ResourceType; label: string }[] = [
  { value: 'slide',      label: 'Slide' },
  { value: 'tutorial',   label: 'Tutorial' },
  { value: 'exercise',   label: 'Exercise' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'recording',  label: 'Recording' },
  { value: 'other',      label: 'Other' },
]

const LABEL = 'block text-[10px] font-semibold uppercase tracking-wide text-[--text-secondary] mb-1'
const INPUT  = 'w-full rounded-lg border border-[--ucsi-border] px-3 py-2 text-sm text-[--text-primary] placeholder:text-[--text-muted] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]'
const INPUT_STYLE: React.CSSProperties = { backgroundColor: 'var(--bg-surface)' }

interface Props {
  sectionId: string
  onSuccess: () => void
  onCancel: () => void
}

export function UploadResourceForm({ sectionId, onSuccess, onCancel }: Props) {
  const [error, setError]       = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsPending(true)

    const data = new FormData(e.currentTarget)
    data.set('sectionId', sectionId)  // injected server-side in the action, sent explicitly here

    try {
      const res  = await fetch('/api/upload/resource', { method: 'POST', body: data })
      const json = await res.json() as { error?: string }
      if (!res.ok) {
        setError(json.error ?? 'Upload failed')
      } else {
        onSuccess()
      }
    } catch {
      setError('Network error — please try again.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={LABEL}>Title *</label>
        <input
          required
          name="title"
          className={INPUT}
          style={INPUT_STYLE}
          placeholder="Resource title"
        />
      </div>

      <div>
        <label className={LABEL}>Description</label>
        <textarea
          rows={2}
          name="description"
          className={`${INPUT} resize-none`}
          style={INPUT_STYLE}
          placeholder="Brief description (optional)"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Type *</label>
          <select name="type" className={INPUT} style={INPUT_STYLE}>
            {RESOURCE_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL}>Visibility</label>
          <select name="isPublished" className={INPUT} style={INPUT_STYLE}>
            <option value="false">Draft</option>
            <option value="true">Published</option>
          </select>
        </div>
      </div>

      <div>
        <label className={LABEL}>File *</label>
        <input
          required
          type="file"
          name="file"
          accept=".pdf,.ppt,.pptx,.doc,.docx,.mp4,.webm,.jpg,.jpeg,.png,.zip"
          className="w-full cursor-pointer rounded-lg border border-[--ucsi-border] px-3 py-2 text-sm text-[--text-primary] file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-zinc-100 file:px-2 file:py-0.5 file:text-xs file:font-medium dark:file:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]"
          style={INPUT_STYLE}
        />
        <p className="mt-1 text-[11px] text-[--text-muted]">Max 100 MB · PDF, PowerPoint, Word, MP4, WebM, JPEG, PNG, ZIP</p>
      </div>

      {error && (
        <p className="text-xs text-red-600" role="alert">{error}</p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="cursor-pointer rounded-md px-3 py-1.5 text-xs text-[--text-secondary] hover:text-[--text-primary] transition-colors focus-visible:outline-none disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red] disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: 'var(--ucsi-red)' }}
        >
          {isPending ? 'Uploading…' : 'Upload Resource'}
        </button>
      </div>
    </form>
  )
}
