'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pin } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'
import { adminDeletePost, adminTogglePin, adminTogglePublishPost } from '@/app/(portal)/admin/resources/actions'
import type { PostType } from '@/types/post'

const POST_BADGE: Record<PostType, { variant: 'warning' | 'info' | 'neutral'; label: string }> = {
  urgent:       { variant: 'warning', label: 'priority' },
  reminder:     { variant: 'warning', label: 'reminder' },
  announcement: { variant: 'info',    label: 'announcement' },
  update:       { variant: 'neutral', label: 'update' },
}

export interface AdminRecentPost {
  id: string
  title: string
  type: PostType
  isPinned: boolean
  isPublished: boolean
  createdAt: string
  sectionLabel: string
  authorName: string
}

interface PostRowProps {
  post: AdminRecentPost
  onDeleted: (id: string) => void
  onToggled: (id: string, isPublished: boolean) => void
  onPinToggled: (id: string, isPinned: boolean) => void
}

function PostRow({ post, onDeleted, onToggled, onPinToggled }: PostRowProps) {
  const router = useRouter()
  const [publishPending, startPublishTransition] = useTransition()
  const [pinPending, startPinTransition] = useTransition()
  const [deletePending, startDeleteTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { variant, label } = POST_BADGE[post.type]

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
    <div className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={variant}>{label}</Badge>
        {post.isPinned && (
          <span className="flex items-center gap-0.5 text-[10px] font-medium uppercase tracking-wide text-[--text-secondary]">
            <Pin size={10} aria-hidden="true" />
            Pinned
          </span>
        )}
        {!post.isPublished && <Badge variant="neutral">Draft</Badge>}
        <span className="truncate text-sm font-medium text-[--text-primary]">{post.title}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-[--text-secondary]">
        <span>{post.sectionLabel}</span>
        <span>·</span>
        <span>{post.authorName}</span>
        <span>·</span>
        <span>{formatDate(post.createdAt)}</span>
      </div>

      {error && <p className="text-[10px] text-red-500">{error}</p>}

      {confirming ? (
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-[--text-secondary]">Remove this post?</span>
          <button
            type="button"
            onClick={() => { setConfirming(false); setError(null) }}
            disabled={deletePending}
            className="text-xs text-[--text-secondary] hover:underline disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deletePending}
            className="rounded px-2 py-0.5 text-xs font-medium text-white disabled:cursor-wait disabled:opacity-50"
            style={{ backgroundColor: 'var(--ucsi-red)' }}
          >
            {deletePending ? 'Removing…' : 'Remove'}
          </button>
        </div>
      ) : (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePublish}
            disabled={publishPending}
            className="rounded-md border border-[--ucsi-border] px-3 py-1 text-xs font-medium text-[--text-secondary] transition-colors hover:bg-[--ucsi-red]/10 hover:text-[#C1272D] disabled:cursor-wait disabled:opacity-50"
          >
            {publishPending ? '…' : post.isPublished ? 'Unpublish' : 'Publish'}
          </button>
          <button
            type="button"
            onClick={handleTogglePin}
            disabled={pinPending}
            className="rounded-md border border-[--ucsi-border] px-3 py-1 text-xs font-medium text-[--text-secondary] transition-colors hover:bg-[--ucsi-red]/10 hover:text-[#C1272D] disabled:cursor-wait disabled:opacity-50"
          >
            {pinPending ? '…' : post.isPinned ? 'Unpin' : 'Pin'}
          </button>
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

export function AdminRecentPosts({ initialPosts }: { initialPosts: AdminRecentPost[] }) {
  const [posts, setPosts] = useState<AdminRecentPost[]>(initialPosts)

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-[--text-primary]">Recent Posts</h2>
        <p className="text-xs text-[--text-secondary]">Latest activity across all sections</p>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <p className="py-2 text-center text-sm text-[--text-muted]">No posts to display.</p>
        ) : (
          <div className="flex flex-col divide-y divide-[--ucsi-border]">
            {posts.map((post) => (
              <PostRow
                key={post.id}
                post={post}
                onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                onToggled={(id, isPublished) =>
                  setPosts((prev) => prev.map((p) => p.id === id ? { ...p, isPublished } : p))
                }
                onPinToggled={(id, isPinned) =>
                  setPosts((prev) => prev.map((p) => p.id === id ? { ...p, isPinned } : p))
                }
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
