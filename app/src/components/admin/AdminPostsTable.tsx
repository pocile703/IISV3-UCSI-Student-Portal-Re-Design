'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Pin } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'
import {
  adminDeletePost,
  adminTogglePin,
  adminTogglePublishPost,
} from '@/app/(portal)/admin/resources/actions'
import type { PostsPageRow } from '@/types/admin-posts'

// ─── Label / badge maps ────────────────────────────────────────────────────

const POST_TYPE_LABELS: Record<string, string> = {
  announcement: 'Announcement',
  urgent:       'Urgent',
  reminder:     'Reminder',
  update:       'Update',
}

const POST_TYPE_BADGE_VARIANT: Record<string, 'warning' | 'info' | 'neutral' | 'danger'> = {
  urgent:       'warning',
  reminder:     'warning',
  announcement: 'info',
  update:       'neutral',
}

// ─── ChipBar ──────────────────────────────────────────────────────────────

interface ChipBarProps {
  options: { value: string; label: string }[]
  active: string
  onSelect: (v: string) => void
}

function ChipBar({ options, active, onSelect }: ChipBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onSelect(opt.value)}
          className={
            active === opt.value
              ? 'rounded-full px-3 py-1 text-xs font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]'
              : 'rounded-full border border-[--ucsi-border] px-3 py-1 text-xs font-medium text-[--text-secondary] transition-colors hover:bg-[--ucsi-red]/15 hover:text-[#C1272D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]'
          }
          style={active === opt.value ? { backgroundColor: 'var(--ucsi-red)' } : undefined}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── PostActionRow ─────────────────────────────────────────────────────────
// Extracted from .map() so each row owns its own useTransition — hooks-in-map rule.

interface PostActionRowProps {
  post: PostsPageRow
  onDeleted: (id: string) => void
  onToggled: (id: string, isPublished: boolean) => void
  onPinToggled: (id: string, isPinned: boolean) => void
}

function PostActionRow({ post, onDeleted, onToggled, onPinToggled }: PostActionRowProps) {
  const router = useRouter()
  const [publishPending, startPublishTransition] = useTransition()
  const [pinPending, startPinTransition] = useTransition()
  const [deletePending, startDeleteTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleTogglePublish() {
    startPublishTransition(async () => {
      const result = await adminTogglePublishPost(post.id)
      if (result?.error) { setError(result.error); return }
      onToggled(post.id, !post.isPublished)
      router.refresh()
    })
  }

  function handleTogglePin() {
    startPinTransition(async () => {
      const result = await adminTogglePin(post.id)
      if (result?.error) { setError(result.error); return }
      onPinToggled(post.id, !post.isPinned)
      router.refresh()
    })
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      const result = await adminDeletePost(post.id)
      if (result?.error) { setError(result.error); setConfirming(false); return }
      onDeleted(post.id)
      router.refresh()
    })
  }

  return (
    <td className="px-5 py-3 text-right">
      <div className="flex flex-col items-end gap-1.5">
        {confirming ? (
          <span className="flex items-center gap-2">
            <span className="text-[11px] text-[--text-secondary]">Remove this post?</span>
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
          <span className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleTogglePublish}
              disabled={publishPending}
              aria-label={`${post.isPublished ? 'Unpublish' : 'Publish'} ${post.title}`}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[#C1272D]/30 px-3 py-1 text-xs font-medium text-[#C1272D] transition-colors hover:bg-[--ucsi-red]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red] disabled:cursor-wait disabled:opacity-50"
            >
              {publishPending ? '…' : post.isPublished ? 'Unpublish' : 'Publish'}
            </button>
            <button
              type="button"
              onClick={handleTogglePin}
              disabled={pinPending}
              aria-label={`${post.isPinned ? 'Unpin' : 'Pin'} ${post.title}`}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[--ucsi-border] px-3 py-1 text-xs font-medium text-[--text-secondary] transition-colors hover:bg-[--ucsi-red]/10 hover:text-[#C1272D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red] disabled:cursor-wait disabled:opacity-50"
            >
              {pinPending ? '…' : post.isPinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              type="button"
              onClick={() => { setConfirming(true); setError(null) }}
              aria-label={`Remove ${post.title}`}
              className="text-[11px] text-[--text-secondary] underline-offset-2 hover:text-[#C1272D] hover:underline"
            >
              Remove
            </button>
          </span>
        )}
        {error && <p className="text-[10px] text-red-500">{error}</p>}
      </div>
    </td>
  )
}

// ─── AdminPostsTable ───────────────────────────────────────────────────────

export function AdminPostsTable({ initialPosts }: { initialPosts: PostsPageRow[] }) {
  const [posts, setPosts] = useState<PostsPageRow[]>(initialPosts)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [scopeFilter, setScopeFilter] = useState('all')
  const [pinnedOnly, setPinnedOnly] = useState(false)

  const presentTypes = useMemo(
    () => [...new Set(posts.map((p) => p.type))].sort(),
    [posts],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return posts.filter((p) => {
      if (statusFilter === 'published' && !p.isPublished) return false
      if (statusFilter === 'draft' && p.isPublished) return false
      if (typeFilter !== 'all' && p.type !== typeFilter) return false
      if (scopeFilter === 'global' && p.courseSectionId !== null) return false
      if (scopeFilter === 'section' && p.courseSectionId === null) return false
      if (pinnedOnly && !p.isPinned) return false
      if (q && ![p.title, p.body.slice(0, 200), p.authorName, p.sectionLabel].some((s) =>
        s.toLowerCase().includes(q),
      )) return false
      return true
    })
  }, [posts, search, statusFilter, typeFilter, scopeFilter, pinnedOnly])

  const isFiltering =
    search.trim() !== '' ||
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    scopeFilter !== 'all' ||
    pinnedOnly

  function handleDeleted(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  function handleToggled(id: string, isPublished: boolean) {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, isPublished } : p))
  }

  function handlePinToggled(id: string, isPinned: boolean) {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, isPinned } : p))
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Search */}
      <div className="relative">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[--text-muted]"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search by title, content, author or section…"
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

      {/* Filter rows */}
      <div className="flex flex-col gap-2">
        {/* Row 1: status + pinned toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <ChipBar
            options={[
              { value: 'all',       label: 'All' },
              { value: 'published', label: 'Published' },
              { value: 'draft',     label: 'Draft' },
            ]}
            active={statusFilter}
            onSelect={setStatusFilter}
          />
          <button
            type="button"
            onClick={() => setPinnedOnly((v) => !v)}
            className={
              pinnedOnly
                ? 'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]'
                : 'flex items-center gap-1 rounded-full border border-[--ucsi-border] px-3 py-1 text-xs font-medium text-[--text-secondary] transition-colors hover:bg-[--ucsi-red]/15 hover:text-[#C1272D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]'
            }
            style={pinnedOnly ? { backgroundColor: 'var(--ucsi-red)' } : undefined}
          >
            <Pin size={10} aria-hidden="true" />
            Pinned only
          </button>
        </div>

        {/* Row 2: type + divider + scope */}
        <div className="flex flex-wrap items-center gap-3">
          <ChipBar
            options={[
              { value: 'all', label: 'All types' },
              ...presentTypes.map((t) => ({
                value: t,
                label: POST_TYPE_LABELS[t] ?? t,
              })),
            ]}
            active={typeFilter}
            onSelect={setTypeFilter}
          />
          <span className="h-4 w-px bg-[--ucsi-border]" aria-hidden="true" />
          <ChipBar
            options={[
              { value: 'all',     label: 'All' },
              { value: 'global',  label: 'Global' },
              { value: 'section', label: 'Section' },
            ]}
            active={scopeFilter}
            onSelect={setScopeFilter}
          />
        </div>
      </div>

      {/* Result count */}
      {isFiltering && (
        <p className="text-xs text-[--text-secondary]">
          {filtered.length === 0
            ? 'No posts match the current filters.'
            : `Showing ${filtered.length} of ${posts.length} post${posts.length !== 1 ? 's' : ''}`}
        </p>
      )}

      {/* Table */}
      <section aria-label="All posts">
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-[--text-muted]">
                No posts match the current filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table
                  className="min-w-[52rem] w-full text-sm"
                  aria-label="Posts for moderation"
                >
                  <caption className="sr-only">
                    Posts across all sections and global scope for moderation
                  </caption>
                  <thead>
                    <tr className="border-b border-[--ucsi-border]">
                      <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-[--text-secondary]">Post</th>
                      <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-[--text-secondary]">Scope</th>
                      <th scope="col" className="hidden px-5 py-3 text-left text-xs font-medium text-[--text-secondary] sm:table-cell">Author</th>
                      <th scope="col" className="hidden px-5 py-3 text-left text-xs font-medium text-[--text-secondary] lg:table-cell">Date</th>
                      <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-[--text-secondary]">Status</th>
                      <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-[--text-secondary]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((post) => (
                      <tr
                        key={post.id}
                        className="border-b border-[--ucsi-border] last:border-0 hover:bg-zinc-50 dark:hover:bg-white/5"
                      >
                        {/* Post cell */}
                        <td className="px-5 py-3">
                          <div className="flex flex-col gap-1">
                            <p className="font-medium text-[--text-primary]">{post.title}</p>
                            <p className="line-clamp-1 text-xs text-[--text-secondary]">{post.body}</p>
                            <Badge
                              variant={POST_TYPE_BADGE_VARIANT[post.type] ?? 'neutral'}
                              className="mt-0.5 self-start"
                            >
                              {POST_TYPE_LABELS[post.type] ?? post.type}
                            </Badge>
                          </div>
                        </td>

                        {/* Scope cell */}
                        <td className="px-5 py-3">
                          {post.courseSectionId === null ? (
                            <Badge variant="info">Global</Badge>
                          ) : (
                            <span className="text-xs text-[--text-secondary]">{post.sectionLabel}</span>
                          )}
                        </td>

                        {/* Author cell */}
                        <td className="hidden px-5 py-3 text-xs text-[--text-secondary] sm:table-cell">
                          {post.authorName}
                        </td>

                        {/* Date cell */}
                        <td className="hidden px-5 py-3 text-xs text-[--text-secondary] lg:table-cell">
                          {formatDate(post.createdAt)}
                        </td>

                        {/* Status cell */}
                        <td className="px-5 py-3">
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant={post.isPublished ? 'success' : 'warning'}
                              aria-label={`Status: ${post.isPublished ? 'Published' : 'Draft'}`}
                            >
                              {post.isPublished ? 'Published' : 'Draft'}
                            </Badge>
                            {post.isPinned && (
                              <span className="flex items-center gap-0.5 text-[10px] font-medium text-[--text-secondary]">
                                <Pin size={10} aria-hidden="true" />
                                Pinned
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions cell */}
                        <PostActionRow
                          post={post}
                          onDeleted={handleDeleted}
                          onToggled={handleToggled}
                          onPinToggled={handlePinToggled}
                        />
                      </tr>
                    ))}
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
