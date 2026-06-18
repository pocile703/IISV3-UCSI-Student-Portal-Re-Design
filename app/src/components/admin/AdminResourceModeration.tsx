'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'
import { adminDeleteResource } from '@/app/(portal)/admin/resources/actions'

export interface AdminModerationResource {
  id: string
  title: string
  type: string
  createdAt: string
  sectionLabel: string
  uploaderName: string
}

interface ResourceRowProps {
  resource: AdminModerationResource
  onRemoved: (id: string) => void
}

function ResourceRow({ resource, onRemoved }: ResourceRowProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    startTransition(async () => {
      const result = await adminDeleteResource(resource.id)
      if (result?.error) { setError(result.error); setConfirming(false); return }
      onRemoved(resource.id)
      router.refresh()
    })
  }

  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <p className="text-sm font-medium text-[--text-primary]">{resource.title}</p>
      <p className="mt-0.5 text-xs text-[--text-secondary]">
        {resource.sectionLabel} · {resource.uploaderName}
      </p>
      <p className="text-xs text-[--text-secondary]">{formatDate(resource.createdAt)}</p>

      {error && <p className="mt-0.5 text-[10px] text-red-500">{error}</p>}

      {confirming ? (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-[--text-secondary]">Remove this resource?</span>
          <button
            type="button"
            onClick={() => { setConfirming(false); setError(null) }}
            disabled={pending}
            className="text-xs text-[--text-secondary] hover:underline disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="rounded px-2 py-0.5 text-xs font-medium text-white disabled:cursor-wait disabled:opacity-50"
            style={{ backgroundColor: 'var(--ucsi-red)' }}
          >
            {pending ? 'Removing…' : 'Remove'}
          </button>
        </div>
      ) : (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => { setConfirming(true); setError(null) }}
            className="rounded-md border border-[--ucsi-border] px-3 py-1 text-xs font-medium text-[--text-secondary] transition-colors hover:bg-[--ucsi-red]/10 hover:text-[#C1272D]"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  )
}

export function AdminResourceModeration({ initialResources }: { initialResources: AdminModerationResource[] }) {
  const [resources, setResources] = useState<AdminModerationResource[]>(initialResources)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[--text-primary]">Recent Resources</h2>
        </div>
        <p className="text-xs text-[--text-secondary]">
          Published by lecturers — remove to take down
        </p>
      </CardHeader>
      <CardContent>
        {resources.length === 0 ? (
          <p className="py-2 text-center text-sm text-[--text-muted]">No resources to display.</p>
        ) : (
          <div className="flex flex-col divide-y divide-[--ucsi-border]">
            {resources.map((resource) => (
              <ResourceRow
                key={resource.id}
                resource={resource}
                onRemoved={(id) => setResources((prev) => prev.filter((r) => r.id !== id))}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
