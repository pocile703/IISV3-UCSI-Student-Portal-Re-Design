'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Upload } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { TogglePublishButton } from '@/components/lecturer/TogglePublishButton'
import { DeleteResourceButton } from '@/components/lecturer/DeleteResourceButton'
import { UploadResourceForm } from '@/components/lecturer/UploadResourceForm'
import { EditResourceForm } from '@/components/lecturer/EditResourceModal'
import { formatDate } from '@/lib/utils'
import type { LearningResource, ResourceAttachment, ResourceType } from '@/types/resource'

const TYPE_LABELS: Record<ResourceType, string> = {
  slide:      'Slide',
  tutorial:   'Tutorial',
  exercise:   'Exercise',
  assignment: 'Assignment',
  recording:  'Recording',
  other:      'Other',
}

type ResourceState = { error?: string; success?: boolean }

interface Props {
  sectionId: string
  resources: LearningResource[]
  attachments: ResourceAttachment[]
  editActionBase: (resourceId: string, _prev: ResourceState, formData: FormData) => Promise<ResourceState>
  deleteActionBase: (resourceId: string) => Promise<ResourceState>
  toggleActionBase: (resourceId: string) => Promise<ResourceState>
}

export function ResourceManager({
  sectionId,
  resources,
  attachments,
  editActionBase,
  deleteActionBase,
  toggleActionBase,
}: Props) {
  const router = useRouter()
  const [items, setItems]           = useState<LearningResource[]>(resources)
  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'all'>('all')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editingId, setEditingId]   = useState<string | null>(null)

  const presentTypes = [...new Set(items.map(r => r.type))]

  const filtered = items
    .filter(r => typeFilter === 'all' || r.type === typeFilter)
    .filter(r => r.title.toLowerCase().includes(search.toLowerCase()))

  function openUpload() {
    setUploadOpen(o => !o)
    setEditingId(null)
  }

  function openEdit(id: string) {
    setEditingId(id)
    setUploadOpen(false)
  }

  function handleUploadSuccess() {
    setUploadOpen(false)
    router.refresh()
  }

  function handleEditSuccess() {
    setEditingId(null)
    router.refresh()
  }

  function makeDeleteHandler(resourceId: string) {
    return async (): Promise<ResourceState> => {
      const result = await deleteActionBase(resourceId)
      if (result.success) {
        setItems(prev => prev.filter(r => r.id !== resourceId))
        router.refresh()
      }
      return result
    }
  }

  function makeToggleHandler(resourceId: string) {
    return async (): Promise<ResourceState> => {
      const result = await toggleActionBase(resourceId)
      if (result.success) {
        setItems(prev =>
          prev.map(r => r.id === resourceId ? { ...r, isPublished: !r.isPublished } : r),
        )
        router.refresh()
      }
      return result
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[--text-primary]">Resources</h2>
            <span className="text-xs text-[--text-secondary]">{items.length} total</span>
          </div>
          <button
            onClick={openUpload}
            className="flex items-center gap-1.5 rounded-md border border-[--ucsi-border] px-2.5 py-1.5 text-xs font-medium text-[--text-secondary] transition-colors hover:bg-[--ucsi-red]/15 hover:text-[#C1272D] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]"
          >
            <Upload size={13} aria-hidden="true" />
            Upload Resource
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Search */}
        <div className="relative mb-3">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search resources…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[--ucsi-border] py-2 pl-8 pr-3 text-sm text-[--text-primary] placeholder:text-[--text-muted] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          />
        </div>

        {/* Filter chips */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {(['all', ...presentTypes] as (ResourceType | 'all')[]).map(t => {
            const active = typeFilter === t
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus-visible:outline-none ${
                  active
                    ? 'text-white'
                    : 'border border-[--ucsi-border] text-[--text-secondary] hover:bg-[--ucsi-red]/15 hover:text-[#C1272D]'
                }`}
                style={active
                  ? { backgroundColor: 'var(--ucsi-red)' }
                  : { backgroundColor: 'var(--bg-elevated)' }
                }
              >
                {t === 'all' ? 'All' : TYPE_LABELS[t]}
              </button>
            )
          })}
        </div>

        {/* Upload form */}
        {uploadOpen && (
          <div
            className="mb-4 rounded-xl border border-[--ucsi-border] p-4"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            <p className="mb-3 text-xs font-semibold text-[--text-secondary]">New resource</p>
            <UploadResourceForm
              sectionId={sectionId}
              onSuccess={handleUploadSuccess}
              onCancel={() => setUploadOpen(false)}
            />
          </div>
        )}

        {/* Resource list */}
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-[--text-muted]">
            {search ? 'No resources match your search.' : 'No resources yet. Upload the first one.'}
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-[--ucsi-border]">
            {filtered.map(resource => {
              const attachment = attachments.find(a => a.resourceId === resource.id)
              const isEditing  = editingId === resource.id

              // Bind resourceId per-resource so child components receive () => Promise<...>.
              const editAction = editActionBase.bind(null, resource.id) as (
                _prev: ResourceState,
                formData: FormData,
              ) => Promise<ResourceState>

              return (
                <div key={resource.id} className="py-3">
                  {isEditing ? (
                    <EditResourceForm
                      resource={resource}
                      action={editAction}
                      onSuccess={handleEditSuccess}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      <div className="flex flex-wrap items-start gap-2">
                        <Badge variant="neutral" className="shrink-0 text-[10px]">
                          {TYPE_LABELS[resource.type]}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[--text-primary]">{resource.title}</p>
                          {resource.description && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-[--text-secondary]">
                              {resource.description}
                            </p>
                          )}
                          {attachment && (
                            <p className="mt-0.5 text-xs text-[--text-secondary]">
                              {attachment.originalFilename} · ↓ {attachment.downloadCount}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <TogglePublishButton
                          isPublished={resource.isPublished}
                          onToggle={makeToggleHandler(resource.id)}
                        />
                        <span className="text-xs text-[--text-secondary]">
                          {formatDate(resource.createdAt)}
                        </span>
                        <div className="ml-auto flex items-center gap-3">
                          <button
                            onClick={() => openEdit(resource.id)}
                            className="cursor-pointer text-xs text-[--text-secondary] hover:text-[--text-primary] transition-colors focus-visible:outline-none"
                          >
                            Edit
                          </button>
                          <DeleteResourceButton
                            resourceTitle={resource.title}
                            onDelete={makeDeleteHandler(resource.id)}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
