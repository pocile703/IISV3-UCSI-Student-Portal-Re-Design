'use client'
import { useState, useEffect, useActionState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pin } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import type { ClassPost, PostType } from '@/types/post'

const POST_BADGE: Record<PostType, 'danger' | 'warning' | 'info' | 'neutral'> = {
  urgent:       'danger',
  reminder:     'warning',
  announcement: 'info',
  update:       'neutral',
}

const POST_TYPE_OPTIONS: { value: PostType; label: string }[] = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'urgent',       label: 'Urgent' },
  { value: 'reminder',     label: 'Reminder' },
  { value: 'update',       label: 'Update' },
]

function sortPosts(posts: ClassPost[]): ClassPost[] {
  return [...posts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return b.createdAt.localeCompare(a.createdAt)
  })
}

const LABEL = 'block text-[10px] font-semibold uppercase tracking-wide text-[--text-muted] mb-1'
const INPUT  = 'w-full rounded-lg border border-[--ucsi-border] px-3 py-2 text-sm text-[--text-primary] placeholder:text-[--text-muted] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]'

type PostState = { error?: string; success?: boolean }

// ── PostForm ──────────────────────────────────────────────────────────────────
// isPinned uses a hidden input so the server receives 'true'/'false'; the visible
// checkbox drives the hidden input but has no `name` to avoid double-submission.

interface PostFormProps {
  initial?: ClassPost
  action: (_prev: PostState, formData: FormData) => Promise<PostState>
  onSuccess: () => void
  onCancel: () => void
}

function PostForm({ initial, action, onSuccess, onCancel }: PostFormProps) {
  const [isPinned, setIsPinned]      = useState(initial?.isPinned ?? false)
  const [state, dispatch, isPending] = useActionState(action, {})

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (state.success) onSuccess() }, [state.success])

  return (
    <form
      action={dispatch}
      className="flex flex-col gap-3 rounded-xl border border-[--ucsi-border] p-4"
      style={{ backgroundColor: 'var(--bg-elevated)' }}
    >
      <input type="hidden" name="isPinned" value={isPinned ? 'true' : 'false'} />

      <div>
        <label className={LABEL}>Title *</label>
        <input
          required
          name="title"
          defaultValue={initial?.title ?? ''}
          className={INPUT}
          style={{ backgroundColor: 'var(--bg-surface)' }}
          placeholder="Post title"
        />
      </div>

      <div>
        <label className={LABEL}>Body *</label>
        <textarea
          required
          rows={3}
          name="body"
          defaultValue={initial?.body ?? ''}
          className={`${INPUT} resize-none`}
          style={{ backgroundColor: 'var(--bg-surface)' }}
          placeholder="Post content…"
        />
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className={LABEL}>Type *</label>
          <select
            name="type"
            defaultValue={initial?.type ?? 'announcement'}
            className={INPUT}
            style={{ backgroundColor: 'var(--bg-surface)', width: 'auto' }}
          >
            {POST_TYPE_OPTIONS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm text-[--text-secondary]">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={e => setIsPinned(e.target.checked)}
            className="accent-[#C1272D]"
          />
          Pin this post
        </label>
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
          {isPending ? 'Saving…' : (initial ? 'Save Changes' : 'Post')}
        </button>
      </div>
    </form>
  )
}

// ── PostItem ──────────────────────────────────────────────────────────────────
// Owns pin-toggle + delete interaction state so useTransition can live here
// (hooks cannot be called inside a .map() callback in the parent).

interface PostItemProps {
  post: ClassPost
  isOwned: boolean
  onTogglePin: () => Promise<PostState>
  onDelete: () => Promise<PostState>
  onEdit: () => void
}

function PostItem({ post, isOwned, onTogglePin, onDelete, onEdit }: PostItemProps) {
  const [confirming, setConfirming]   = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPinPending, startPin]      = useTransition()
  const [isDelPending, startDel]      = useTransition()

  function handleTogglePin() {
    startPin(async () => { await onTogglePin() })
  }

  function handleDelete() {
    setDeleteError(null)
    startDel(async () => {
      const result = await onDelete()
      if (result.error) setDeleteError(result.error)
      else setConfirming(false)
    })
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={POST_BADGE[post.type]} className="shrink-0 text-[10px]">
          {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
        </Badge>
        {post.isPinned && (
          <Pin size={12} aria-label="Pinned" style={{ color: 'var(--ucsi-red)' }} />
        )}
        <p className="min-w-0 flex-1 text-sm font-medium text-[--text-primary]">
          {post.title}
        </p>
        <span className="shrink-0 text-xs text-[--text-muted]">
          {formatDate(post.createdAt)}
        </span>
      </div>

      <p className="mt-1 line-clamp-2 text-xs text-[--text-secondary]">{post.body}</p>

      {confirming ? (
        <div className="mt-2 flex flex-col gap-1">
          <div
            className="flex items-center justify-between gap-3 rounded-lg border border-[--ucsi-border] p-3"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            <p className="text-sm text-[--text-primary]">Delete this post?</p>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => { setConfirming(false); setDeleteError(null) }}
                disabled={isDelPending}
                className="cursor-pointer text-xs text-[--text-secondary] hover:text-[--text-primary] transition-colors focus-visible:outline-none disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDelPending}
                className="cursor-pointer rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDelPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
          {deleteError && (
            <p className="text-xs text-red-600" role="alert">{deleteError}</p>
          )}
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-3">
          {isOwned ? (
            <>
              <button
                onClick={handleTogglePin}
                disabled={isPinPending}
                className="cursor-pointer text-xs text-[--text-secondary] hover:text-[#C1272D] transition-colors focus-visible:outline-none disabled:opacity-50"
                aria-label={post.isPinned ? 'Unpin post' : 'Pin post'}
              >
                {isPinPending ? '…' : (post.isPinned ? 'Unpin' : 'Pin')}
              </button>
              <button
                onClick={onEdit}
                className="cursor-pointer text-xs text-[--text-secondary] hover:text-[--text-primary] transition-colors focus-visible:outline-none"
              >
                Edit
              </button>
              <button
                onClick={() => setConfirming(true)}
                className="cursor-pointer text-xs text-[--text-muted] hover:text-red-600 transition-colors focus-visible:outline-none"
              >
                Delete
              </button>
            </>
          ) : (
            <span className="text-[11px] text-[--text-muted]">Posted by another lecturer</span>
          )}
        </div>
      )}
    </>
  )
}

// ── ClassPostPanel ────────────────────────────────────────────────────────────

interface Props {
  posts: ClassPost[]
  currentUserId: string
  createAction: (_prev: PostState, formData: FormData) => Promise<PostState>
  editActionBase: (postId: string, _prev: PostState, formData: FormData) => Promise<PostState>
  togglePinBase: (postId: string) => Promise<PostState>
  deleteActionBase: (postId: string) => Promise<PostState>
}

export function ClassPostPanel({
  posts,
  currentUserId,
  createAction,
  editActionBase,
  togglePinBase,
  deleteActionBase,
}: Props) {
  const router = useRouter()
  const [items, setItems]           = useState<ClassPost[]>(() => sortPosts(posts))
  const [createOpen, setCreateOpen] = useState(false)
  const [editingId, setEditingId]   = useState<string | null>(null)

  function openCreate() {
    setCreateOpen(o => !o)
    setEditingId(null)
  }

  function openEdit(id: string) {
    setEditingId(id)
    setCreateOpen(false)
  }

  function makeTogglePinHandler(postId: string) {
    return async (): Promise<PostState> => {
      const result = await togglePinBase(postId)
      if (result.success) {
        setItems(prev => sortPosts(prev.map(p => p.id === postId ? { ...p, isPinned: !p.isPinned } : p)))
        router.refresh()
      }
      return result
    }
  }

  function makeDeleteHandler(postId: string) {
    return async (): Promise<PostState> => {
      const result = await deleteActionBase(postId)
      if (result.success) {
        setItems(prev => prev.filter(p => p.id !== postId))
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
            <h2 className="text-sm font-semibold text-[--text-primary]">Class Posts</h2>
            <span className="text-xs text-[--text-secondary]">{items.length} total</span>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-md border border-[--ucsi-border] px-2.5 py-1.5 text-xs font-medium text-[--text-secondary] transition-colors hover:bg-[--ucsi-red]/15 hover:text-[#C1272D] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]"
          >
            + New Post
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {createOpen && (
          <div className="mb-4">
            <PostForm
              action={createAction}
              onSuccess={() => { setCreateOpen(false); router.refresh() }}
              onCancel={() => setCreateOpen(false)}
            />
          </div>
        )}

        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-[--text-muted]">
            No posts yet. Create the first one.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-[--ucsi-border]">
            {items.map(post => {
              // Bind postId so EditForm receives a (_prev, formData) => Promise action.
              const editAction = editActionBase.bind(null, post.id) as (
                _prev: PostState,
                formData: FormData,
              ) => Promise<PostState>

              return (
                <div key={post.id} className="py-3">
                  {editingId === post.id ? (
                    <PostForm
                      initial={post}
                      action={editAction}
                      onSuccess={() => { setEditingId(null); router.refresh() }}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <PostItem
                      post={post}
                      isOwned={post.authorId === currentUserId}
                      onTogglePin={makeTogglePinHandler(post.id)}
                      onDelete={makeDeleteHandler(post.id)}
                      onEdit={() => openEdit(post.id)}
                    />
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
