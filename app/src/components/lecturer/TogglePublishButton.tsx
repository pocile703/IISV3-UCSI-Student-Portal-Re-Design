'use client'
import { useTransition } from 'react'
import { Badge } from '@/components/ui/Badge'

interface Props {
  isPublished: boolean
  onToggle: () => Promise<{ error?: string; success?: boolean }>
}

export function TogglePublishButton({ isPublished, onToggle }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => { await onToggle() })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red] disabled:cursor-not-allowed disabled:opacity-60"
      aria-label={isPublished ? 'Unpublish resource' : 'Publish resource'}
    >
      {isPublished ? (
        <Badge variant="success">{isPending ? '…' : 'Published'}</Badge>
      ) : (
        <Badge variant="neutral">{isPending ? '…' : 'Draft'}</Badge>
      )}
    </button>
  )
}
