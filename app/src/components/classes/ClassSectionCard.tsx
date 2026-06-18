'use client'

import { useState, useEffect } from 'react'
import {
  ChevronDown, User,
  FileText, BookOpen, ClipboardList, Download, Video, Dumbbell, Pin,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatDate, cn } from '@/lib/utils'
import type { ResourceType } from '@/types/resource'
import type { PostType } from '@/types/post'
import type { ClassesPost, ClassesResource } from '@/types/classes'

// ── Icon / variant maps ──────────────────────────────────────────

const TYPE_ICON: Record<ResourceType, React.ElementType> = {
  slide:      FileText,
  tutorial:   BookOpen,
  exercise:   Dumbbell,
  assignment: ClipboardList,
  recording:  Video,
  other:      FileText,
}

const TYPE_VARIANT: Record<ResourceType, 'info' | 'warning' | 'danger' | 'neutral'> = {
  slide:      'info',
  tutorial:   'info',
  exercise:   'info',
  assignment: 'danger',
  recording:  'neutral',
  other:      'neutral',
}

const POST_BADGE_VARIANT: Record<PostType, 'danger' | 'warning' | 'info' | 'neutral'> = {
  urgent:       'danger',
  reminder:     'warning',
  announcement: 'info',
  update:       'neutral',
}

const POST_TYPE_LABEL: Record<PostType, string> = {
  urgent:       'Urgent',
  reminder:     'Reminder',
  announcement: 'Announcement',
  update:       'Update',
}

// ── Helper ───────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Sub-components ───────────────────────────────────────────────

type DownloadState = 'idle' | 'loading' | 'error'

function ResourceItem({ res, sectionId }: { res: ClassesResource; sectionId: string }) {
  const Icon = TYPE_ICON[res.type]
  const [dlState, setDlState] = useState<DownloadState>('idle')

  async function handleDownload() {
    if (!res.attachment || dlState === 'loading') return
    setDlState('loading')
    try {
      const resp = await fetch(`/api/files/${sectionId}/${res.attachment.id}`)
      if (!resp.ok) { setDlState('error'); return }
      const blob = await resp.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = res.attachment.originalFilename
      a.click()
      URL.revokeObjectURL(url)
      setDlState('idle')
    } catch {
      setDlState('error')
    }
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-[--ucsi-border] p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-white/5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[--text-secondary]" style={{ backgroundColor: 'var(--bg-elevated)' }}>
        <Icon size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[--text-primary]">{res.title}</p>
        {res.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-[--text-secondary]">{res.description}</p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-[--text-secondary]">
          <span>Added {formatDate(res.createdAt)}</span>
          {res.attachment && (
            <>
              <span>{formatBytes(res.attachment.fileSizeBytes)}</span>
              <span>{res.attachment.downloadCount} downloads</span>
            </>
          )}
        </div>
        {dlState === 'error' && (
          <p className="mt-1 text-[10px] text-red-500">Download failed — please try again.</p>
        )}
      </div>
      {res.attachment && (
        <button
          type="button"
          onClick={handleDownload}
          disabled={dlState === 'loading'}
          className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-[--text-secondary] transition-colors hover:bg-[--ucsi-red]/15 hover:text-[#C1272D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red] disabled:cursor-wait disabled:opacity-50"
          aria-label={`Download ${res.attachment.originalFilename}`}
        >
          <Download size={13} aria-hidden="true" />
          {dlState === 'loading' ? 'Downloading…' : 'Download'}
        </button>
      )}
    </div>
  )
}

function PostItem({ post }: { post: ClassesPost }) {
  const isUrgent = post.type === 'urgent'
  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        isUrgent
          ? 'border-red-300 bg-red-50 dark:border-red-800/60 dark:bg-red-950/20'
          : 'border-[--ucsi-border]',
      )}
      style={isUrgent ? undefined : { backgroundColor: 'var(--bg-surface)' }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={POST_BADGE_VARIANT[post.type]}>{POST_TYPE_LABEL[post.type]}</Badge>
        {post.isPinned && (
          <span className="flex items-center gap-0.5 text-[10px] font-medium uppercase tracking-wide text-[--text-secondary]">
            <Pin size={10} aria-hidden="true" />
            Pinned
          </span>
        )}
      </div>
      <p className={cn('mt-1.5 text-sm font-semibold', isUrgent ? 'text-red-700 dark:text-red-400' : 'text-[--text-primary]')}>
        {post.title}
      </p>
      <p className="mt-1 text-sm text-[--text-secondary]">{post.body}</p>
      <p className="mt-2 text-[10px] text-[--text-secondary]">
        {post.authorName} · {formatDate(post.createdAt)}
      </p>
    </div>
  )
}

// ── Public types ─────────────────────────────────────────────────

export interface CategoryGroup {
  type: ResourceType
  label: string
  items: ClassesResource[]
}

export interface ClassSectionCardProps {
  sectionId: string
  sectionCode: string
  room: string
  courseCode: string
  courseTitle: string
  lecturerName: string
  posts: ClassesPost[]
  categories: CategoryGroup[]
  defaultOpen?: boolean
}

type ActiveFilter = 'all' | 'posts' | ResourceType

// ── Main component ───────────────────────────────────────────────

export function ClassSectionCard({
  sectionId,
  sectionCode,
  room,
  courseCode,
  courseTitle,
  lecturerName,
  posts,
  categories,
  defaultOpen = true,
}: ClassSectionCardProps) {
  const storageKey = `class-open-${sectionId}`
  const [open, setOpen] = useState(defaultOpen)
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all')

  // Sync collapse state from localStorage after mount (SSR-safe: never read storage
  // in a useState initialiser — server/client mismatch breaks React 19 hydration).
  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe localStorage sync; initialiser would cause server/client mismatch
    if (saved !== null) setOpen(saved === 'true')
  }, [storageKey])

  function handleToggle() {
    setOpen((prev) => {
      const next = !prev
      localStorage.setItem(storageKey, String(next))
      if (!next) setActiveFilter('all') // reset filter on collapse
      return next
    })
  }

  const totalResources = categories.reduce((sum, c) => sum + c.items.length, 0)
  const hasPosts = posts.length > 0
  const hasResources = categories.length > 0
  const hasContent = hasPosts || hasResources

  // Build filter chip list from what actually exists in this section
  const filterChips: { id: ActiveFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: posts.length + totalResources },
    ...(hasPosts ? [{ id: 'posts' as const, label: 'Posts', count: posts.length }] : []),
    ...categories.map((c) => ({ id: c.type, label: c.label, count: c.items.length })),
  ]

  const showPosts = activeFilter === 'all' || activeFilter === 'posts'
  const visibleCategories = activeFilter === 'all'
    ? categories
    : activeFilter === 'posts'
      ? []
      : categories.filter((c) => c.type === activeFilter)

  return (
    <div className="rounded-xl border border-[--ucsi-border] shadow-sm" style={{ backgroundColor: 'var(--bg-surface)' }}>
      {/* Clickable header */}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'flex w-full items-start justify-between gap-3 px-5 pt-5 pb-4 text-left transition-colors hover:bg-zinc-100/50 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[--ucsi-red]',
          open ? 'rounded-t-xl' : 'rounded-xl',
        )}
        aria-expanded={open}
      >
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[--text-primary]">
            {courseCode} — {courseTitle}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[--text-secondary]">
            <span>Section {sectionCode} · {room}</span>
            <span className="flex items-center gap-1">
              <User size={11} aria-hidden="true" />
              {lecturerName}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          {hasPosts && (
            <Badge variant="warning">{posts.length} post{posts.length !== 1 ? 's' : ''}</Badge>
          )}
          <Badge variant="neutral">{totalResources} file{totalResources !== 1 ? 's' : ''}</Badge>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={cn('text-[--text-muted] transition-transform duration-200', open && 'rotate-180')}
          />
        </div>
      </button>

      {/* Collapsible content */}
      {open && (
        <div className="px-5 pb-5">
          <div className="mb-4 border-t border-[--ucsi-border]" />

          {!hasContent && (
            <p className="py-4 text-center text-sm text-[--text-muted]">No activity yet.</p>
          )}

          {/* Filter chips — only shown when there's something to filter */}
          {hasContent && filterChips.length > 2 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {filterChips.map(({ id, label, count }) => {
                const isActive = activeFilter === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveFilter(id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]',
                      isActive
                        ? 'text-white'
                        : 'border border-[--ucsi-border] text-[--text-secondary] hover:bg-[--ucsi-red]/15 hover:text-[#C1272D] hover:border-[#C1272D]/40',
                    )}
                    style={isActive ? { backgroundColor: 'var(--ucsi-red)' } : undefined}
                  >
                    {label}
                    <span
                      className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-semibold', isActive ? 'bg-white/20' : '')}
                      style={isActive ? undefined : { backgroundColor: 'var(--bg-elevated)' }}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Posts section */}
          {hasPosts && showPosts && (
            <div className={visibleCategories.length > 0 ? 'mb-5' : undefined}>
              <div className="mb-2.5 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-[--text-secondary]">
                  Class Posts
                </span>
                <Badge variant="neutral">{posts.length}</Badge>
              </div>
              <div className="flex flex-col gap-2">
                {posts.map((post) => (
                  <PostItem key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}

          {hasPosts && showPosts && visibleCategories.length > 0 && (
            <div className="mb-5 border-t border-[--ucsi-border]" />
          )}

          {/* Resources section */}
          {visibleCategories.length > 0 && (
            <div className="flex flex-col gap-6">
              {showPosts && hasPosts && (
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[--text-secondary]">
                    Learning Resources
                  </span>
                </div>
              )}
              {visibleCategories.map(({ type, label, items }) => (
                <div key={type}>
                  <div className="mb-2 flex items-center gap-2 border-b border-[--ucsi-border] pb-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[--text-secondary]">
                      {label}
                    </span>
                    <Badge variant={TYPE_VARIANT[type]}>{items.length}</Badge>
                  </div>
                  <div className="flex flex-col gap-2">
                    {items.map((res) => (
                      <ResourceItem key={res.id} res={res} sectionId={sectionId} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
