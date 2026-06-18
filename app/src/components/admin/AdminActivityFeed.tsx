import { MessageSquare, FileText, UserPlus } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'
import { MOCK_ADMIN_ACTIVITY } from '@/data/mock-admin'
import type { AdminActivityItem } from '@/data/mock-admin'

const TYPE_ICON: Record<AdminActivityItem['type'], typeof MessageSquare> = {
  post:     MessageSquare,
  resource: FileText,
  user:     UserPlus,
}

export function AdminActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-[--text-primary]">System Activity</h2>
        <p className="text-xs text-[--text-secondary]">Recent content events</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col divide-y divide-[--ucsi-border]">
          {MOCK_ADMIN_ACTIVITY.map((item) => {
            const Icon = TYPE_ICON[item.type]
            const isUrgent =
              item.type === 'post' && item.title.toLowerCase().includes('urgent')
            return (
              <div key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  className="mt-0.5 shrink-0"
                  style={isUrgent ? { color: 'var(--ucsi-red, #C1272D)' } : undefined}
                >
                  <Icon
                    size={14}
                    className={isUrgent ? '' : 'text-zinc-400'}
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[--text-primary]">{item.actor}</p>
                  <p className="truncate text-xs text-[--text-secondary]">{item.detail}</p>
                  <p className="mt-0.5 text-xs text-[--text-secondary]">
                    {formatDate(item.timestamp)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
