'use client'

import { Fragment, useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FolderOpen, Eye, FileText, ChevronDown, ChevronRight, Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'
import {
  adminTogglePublishResource,
  adminDeleteResource,
} from '@/app/(portal)/admin/resources/actions'

export type ResourceRow = {
  id: string
  title: string
  description: string | null
  type: string
  isPublished: boolean
  uploaderName: string
  attachmentCount: number
  updatedAt: string
}

export type SectionGroup = {
  sectionId: string
  sectionLabel: string
  courseTitle: string
  resources: ResourceRow[]
}

function ResourceActionRow({ resource }: { resource: ResourceRow }) {
  const router = useRouter()
  const [publishPending, startPublishTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [deletePending, startDeleteTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleTogglePublish() {
    startPublishTransition(async () => {
      const result = await adminTogglePublishResource(resource.id)
      if (result?.error) { setError(result.error); return }
      router.refresh()
    })
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      const result = await adminDeleteResource(resource.id)
      if (result?.error) { setError(result.error); setConfirming(false); return }
      router.refresh()
    })
  }

  return (
    <td className="px-5 py-3 text-right">
      <div className="flex flex-col items-end gap-1.5">
        <span className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            aria-label={`Review ${resource.title}`}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[--ucsi-border] px-3 py-1 text-xs font-medium text-[--text-secondary] transition-colors hover:bg-[--ucsi-red]/10 hover:text-[#C1272D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]"
          >
            <Eye size={12} aria-hidden="true" />
            Review
          </button>
          <button
            type="button"
            onClick={handleTogglePublish}
            disabled={publishPending}
            aria-label={`${resource.isPublished ? 'Unpublish' : 'Publish'} ${resource.title}`}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[#C1272D]/30 px-3 py-1 text-xs font-medium text-[#C1272D] transition-colors hover:bg-[--ucsi-red]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red] disabled:cursor-wait disabled:opacity-50"
          >
            <FileText size={12} aria-hidden="true" />
            {publishPending ? '…' : resource.isPublished ? 'Unpublish' : 'Publish'}
          </button>
        </span>
        {confirming ? (
          <span className="flex items-center gap-2">
            <span className="text-[11px] text-[--text-secondary]">Remove?</span>
            <button
              type="button"
              onClick={() => { setConfirming(false); setError(null) }}
              disabled={deletePending}
              className="text-[11px] text-[--text-secondary] hover:underline disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deletePending}
              className="rounded px-2 py-0.5 text-[11px] font-medium text-white disabled:cursor-wait disabled:opacity-50"
              style={{ backgroundColor: 'var(--ucsi-red)' }}
            >
              {deletePending ? 'Removing…' : 'Confirm'}
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => { setConfirming(true); setError(null) }}
            aria-label={`Remove ${resource.title}`}
            className="text-[11px] text-[--text-secondary] underline-offset-2 hover:text-[#C1272D] hover:underline"
          >
            Remove
          </button>
        )}
        {error && <p className="text-[10px] text-red-500">{error}</p>}
      </div>
    </td>
  )
}

export function AdminResourceTable({ groups }: { groups: SectionGroup[] }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const allTypes = useMemo(() => {
    const types = new Set<string>()
    groups.forEach((g) => g.resources.forEach((r) => types.add(r.type)))
    return [...types].sort()
  }, [groups])

  const isFiltering = search.trim() !== '' || typeFilter !== 'all'

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase()
    return groups
      .map((group) => {
        // If the section label or course title matches, show all resources in that section
        const sectionMatches =
          !q ||
          group.sectionLabel.toLowerCase().includes(q) ||
          group.courseTitle.toLowerCase().includes(q)

        return {
          ...group,
          resources: group.resources.filter((r) => {
            const matchesType = typeFilter === 'all' || r.type === typeFilter
            const matchesSearch =
              sectionMatches ||
              r.title.toLowerCase().includes(q) ||
              (r.description?.toLowerCase().includes(q) ?? false)
            return matchesType && matchesSearch
          }),
        }
      })
      .filter((group) => group.resources.length > 0)
  }, [groups, search, typeFilter])

  function toggleSection(sectionId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  function isSectionCollapsed(sectionId: string) {
    // Never collapse while a filter is active — rows must be visible for scanning
    return !isFiltering && collapsed.has(sectionId)
  }

  const totalFiltered = filteredGroups.reduce((n, g) => n + g.resources.length, 0)
  const totalAll = groups.reduce((n, g) => n + g.resources.length, 0)

  return (
    <div className="flex flex-col gap-4">
      {/* Search + type filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search by title or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-[--ucsi-border] bg-transparent py-2 pl-8 pr-8 text-sm text-[--text-primary] placeholder:text-[--text-muted] focus:outline-none focus:ring-2 focus:ring-[--ucsi-red]/40"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[--text-muted] hover:text-[--text-secondary]"
            >
              <X size={13} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {['all', ...allTypes].map((type) => {
            const active = typeFilter === type
            const label = type === 'all' ? 'All types' : type.charAt(0).toUpperCase() + type.slice(1) + 's'
            return (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={
                  active
                    ? 'rounded-full px-3 py-1.5 text-xs font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]'
                    : 'rounded-full border border-[--ucsi-border] px-3 py-1.5 text-xs font-medium text-[--text-secondary] transition-colors hover:bg-[--ucsi-red]/15 hover:text-[#C1272D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]'
                }
                style={active ? { backgroundColor: 'var(--ucsi-red)' } : undefined}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Result count when filtering */}
      {isFiltering && (
        <p className="text-xs text-[--text-secondary]">
          {totalFiltered === 0
            ? 'No resources match the current filters.'
            : `Showing ${totalFiltered} of ${totalAll} resource${totalAll !== 1 ? 's' : ''}`}
        </p>
      )}

      <section aria-label="All learning resources">
        <Card>
          <CardContent className="p-0">
            {filteredGroups.length === 0 ? (
              <div className="py-16 text-center text-sm text-[--text-muted]">
                No resources match the current filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table
                  className="min-w-[56rem] w-full text-sm"
                  aria-label="Learning resources by section"
                >
                  <caption className="sr-only">
                    Learning resources grouped by class section for moderation review
                  </caption>
                  <thead>
                    <tr className="border-b border-[--ucsi-border]">
                      <th
                        scope="col"
                        className="px-5 py-3 text-left text-xs font-medium text-[--text-secondary]"
                      >
                        Resource
                      </th>
                      <th
                        scope="col"
                        className="hidden px-5 py-3 text-left text-xs font-medium text-[--text-secondary] md:table-cell"
                      >
                        Uploaded by
                      </th>
                      <th
                        scope="col"
                        className="hidden px-5 py-3 text-right text-xs font-medium text-[--text-secondary] lg:table-cell"
                      >
                        Files
                      </th>
                      <th
                        scope="col"
                        className="hidden px-5 py-3 text-left text-xs font-medium text-[--text-secondary] lg:table-cell"
                      >
                        Updated
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-3 text-left text-xs font-medium text-[--text-secondary]"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-3 text-right text-xs font-medium text-[--text-secondary]"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGroups.map((group) => {
                      const sectionCollapsed = isSectionCollapsed(group.sectionId)
                      const published = group.resources.filter((r) => r.isPublished).length
                      const drafts = group.resources.length - published

                      return (
                        <Fragment key={group.sectionId}>
                          {/* Section header row — clickable to collapse */}
                          <tr>
                            <td
                              colSpan={6}
                              className="border-y border-[--ucsi-border]"
                              style={{ backgroundColor: 'var(--bg-elevated)' }}
                            >
                              <button
                                type="button"
                                onClick={() => !isFiltering && toggleSection(group.sectionId)}
                                aria-expanded={!sectionCollapsed}
                                aria-label={`${sectionCollapsed ? 'Expand' : 'Collapse'} ${group.sectionLabel}`}
                                className={`flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2.5 text-left ${
                                  isFiltering ? 'cursor-default' : 'cursor-pointer'
                                }`}
                              >
                                <span className="shrink-0 text-[--text-muted]">
                                  {!isFiltering && (
                                    sectionCollapsed
                                      ? <ChevronRight size={14} aria-hidden="true" />
                                      : <ChevronDown size={14} aria-hidden="true" />
                                  )}
                                </span>
                                <span className="text-xs font-semibold text-[--text-primary]">
                                  {group.sectionLabel}
                                </span>
                                {group.courseTitle && (
                                  <span className="text-xs text-[--text-secondary]">
                                    {group.courseTitle}
                                  </span>
                                )}
                                <span className="ml-auto flex items-center gap-2 text-xs text-[--text-secondary]">
                                  {sectionCollapsed
                                    ? `${group.resources.length} resource${group.resources.length !== 1 ? 's' : ''} hidden`
                                    : `${published} published`}
                                  {!sectionCollapsed && drafts > 0 && (
                                    <Badge variant="warning">
                                      {drafts} draft{drafts > 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                </span>
                              </button>
                            </td>
                          </tr>

                          {/* Resource rows — hidden when section is collapsed */}
                          {!sectionCollapsed &&
                            group.resources.map((resource) => (
                              <tr
                                key={resource.id}
                                className="border-b border-[--ucsi-border] hover:bg-zinc-50 dark:hover:bg-white/5"
                              >
                                <td className="px-5 py-3">
                                  <div className="flex items-start gap-3">
                                    <div className="mt-0.5 shrink-0 rounded-lg border border-[--ucsi-border] p-2 text-[--text-secondary]">
                                      <FolderOpen size={14} aria-hidden="true" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-medium text-[--text-primary]">
                                        {resource.title}
                                      </p>
                                      <p className="mt-0.5 line-clamp-1 text-xs text-[--text-secondary]">
                                        {resource.description || 'No description provided.'}
                                      </p>
                                      <Badge variant="info" className="mt-1.5">
                                        {resource.type}
                                      </Badge>
                                    </div>
                                  </div>
                                </td>
                                <td className="hidden px-5 py-3 text-[--text-secondary] md:table-cell">
                                  {resource.uploaderName}
                                </td>
                                <td className="hidden px-5 py-3 text-right text-[--text-secondary] lg:table-cell">
                                  {resource.attachmentCount}
                                </td>
                                <td className="hidden px-5 py-3 text-[--text-secondary] lg:table-cell">
                                  {formatDate(resource.updatedAt)}
                                </td>
                                <td className="px-5 py-3">
                                  <Badge
                                    variant={resource.isPublished ? 'success' : 'warning'}
                                    aria-label={`Status: ${resource.isPublished ? 'Published' : 'Draft'}`}
                                  >
                                    {resource.isPublished ? 'Published' : 'Draft'}
                                  </Badge>
                                </td>
                                <ResourceActionRow resource={resource} />
                              </tr>
                            ))}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
