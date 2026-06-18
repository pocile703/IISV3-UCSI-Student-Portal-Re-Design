import { Upload, MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import type { PostType } from '@/types/post'

export type ActivityItem =
  | { kind: 'resource'; id: string; title: string; courseCode: string; createdAt: string }
  | { kind: 'post';     id: string; title: string; courseCode: string; createdAt: string; postType: PostType }

interface LecturerActivityFeedProps {
  items: ActivityItem[]
}

export function LecturerActivityFeed({ items }: LecturerActivityFeedProps) {
  if (items.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-[--text-muted]">No recent activity.</p>
    )
  }
  return (
    <div className="flex flex-col divide-y divide-[--ucsi-border]">
      {items.map((item) => {
        const isUrgent = item.kind === 'post' && item.postType === 'urgent'
        return (
          <div key={item.id} className="flex items-start gap-3 py-3">
            <span
              className="mt-0.5 shrink-0"
              style={{ color: isUrgent ? 'var(--ucsi-red, #C1272D)' : 'var(--text-muted)' }}
            >
              {item.kind === 'resource'
                ? <Upload size={14} aria-hidden="true" />
                : <MessageSquare size={14} aria-hidden="true" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-[--text-primary]">{item.title}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <Badge variant="neutral" className="text-[10px]">{item.courseCode}</Badge>
                {isUrgent && <Badge variant="danger" className="text-[10px]">urgent</Badge>}
                <span className="text-xs text-[--text-secondary]">{formatDate(item.createdAt)}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
