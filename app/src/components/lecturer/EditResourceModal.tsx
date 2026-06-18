'use client'
import { useActionState, useEffect } from 'react'
import type { LearningResource, ResourceType } from '@/types/resource'

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

type ResourceState = { error?: string; success?: boolean }

interface Props {
  resource: LearningResource
  action: (_prev: ResourceState, formData: FormData) => Promise<ResourceState>
  onSuccess: () => void
  onCancel: () => void
}

export function EditResourceForm({ resource, action, onSuccess, onCancel }: Props) {
  const [state, dispatch, isPending] = useActionState(action, {})

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (state.success) onSuccess() }, [state.success])

  return (
    <form
      action={dispatch}
      className="flex flex-col gap-4 rounded-xl border border-[--ucsi-border] p-4"
      style={{ backgroundColor: 'var(--bg-elevated)' }}
    >
      <p className="text-xs font-semibold text-[--text-secondary]">Editing resource</p>

      <div>
        <label className={LABEL}>Title *</label>
        <input
          required
          name="title"
          defaultValue={resource.title}
          className={INPUT}
          style={INPUT_STYLE}
        />
      </div>

      <div>
        <label className={LABEL}>Description</label>
        <textarea
          rows={2}
          name="description"
          defaultValue={resource.description ?? ''}
          className={`${INPUT} resize-none`}
          style={INPUT_STYLE}
        />
      </div>

      <div>
        <label className={LABEL}>Type *</label>
        <select name="type" defaultValue={resource.type} className={INPUT} style={INPUT_STYLE}>
          {RESOURCE_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {state.error && (
        <p className="text-xs text-red-600" role="alert">{state.error}</p>
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
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
