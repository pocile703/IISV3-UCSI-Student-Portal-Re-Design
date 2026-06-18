import { formatDate } from '@/lib/utils'
import type { ClassPost } from '@/types/post'

export type DashboardAnnouncement = Pick<ClassPost, 'id' | 'title' | 'body' | 'courseSectionId' | 'createdAt'> & {
  sectionCode?: string | null
}

interface AnnouncementCardProps {
  announcement: DashboardAnnouncement
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  return (
    <div className="flex flex-col gap-1 border-b border-[--ucsi-border] py-3 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-[--text-primary]">{announcement.title}</p>
        <span className="shrink-0 text-[11px] text-[--text-secondary]">{formatDate(announcement.createdAt)}</span>
      </div>
      <p className="text-xs text-[--text-secondary] line-clamp-2">{announcement.body}</p>
      {announcement.courseSectionId !== null && (
        <span className="mt-0.5 w-fit rounded-full px-2 py-0.5 text-[10px] text-[--text-secondary]" style={{ backgroundColor: 'var(--bg-elevated)' }}>
          Section: {announcement.sectionCode ?? announcement.courseSectionId}
        </span>
      )}
    </div>
  )
}

interface AnnouncementFeedProps {
  announcements: DashboardAnnouncement[]
}

export function AnnouncementFeed({ announcements }: AnnouncementFeedProps) {
  if (announcements.length === 0) {
    return <p className="py-4 text-center text-sm text-[--text-muted]">No announcements.</p>
  }
  return (
    <div className="flex flex-col">
      {announcements.map((a) => (
        <AnnouncementCard key={a.id} announcement={a} />
      ))}
    </div>
  )
}
