import { Pin } from 'lucide-react'
import { ClassSectionCard } from '@/components/classes/ClassSectionCard'
import { Badge } from '@/components/ui/Badge'
import { getClassesData } from '@/services/classes-queries'
import { cn, formatDate } from '@/lib/utils'
import type { ResourceType } from '@/types/resource'
import type { ClassesPost } from '@/types/classes'

import { auth } from '@/auth'
import { redirect } from 'next/navigation'

const CATEGORIES: { type: ResourceType; label: string }[] = [
  { type: 'slide',      label: 'Slides' },
  { type: 'tutorial',   label: 'Tutorials' },
  { type: 'exercise',   label: 'Exercises' },
  { type: 'assignment', label: 'Assignments' },
  { type: 'recording',  label: 'Recordings' },
  { type: 'other',      label: 'Other Files' },
]

const POST_BADGE_VARIANT = {
  urgent:       'danger',
  reminder:     'warning',
  announcement: 'info',
  update:       'neutral',
} as const

const POST_TYPE_LABEL = {
  urgent:       'Urgent',
  reminder:     'Reminder',
  announcement: 'Announcement',
  update:       'Update',
} as const

function GlobalPostItem({ post }: { post: ClassesPost }) {
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

export default async function ClassesPage() {
  const session = await auth()
  const studentId = session?.user?.studentId
  if (!studentId) redirect('/login')
  const data = await getClassesData(studentId)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-[--text-primary]">Classes</h1>
        <p className="mt-0.5 text-sm text-[--text-secondary]">
          {data.semesterName
            ? `${data.semesterName} — tap a subject to expand`
            : 'No active enrolments for the current semester'}
        </p>
      </div>

      {/* Global announcements strip — admin posts visible across all sections */}
      {data.globalPosts.length > 0 && (
        <section aria-label="Announcements">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[--text-secondary]">
            Announcements
          </h2>
          <div className="flex flex-col gap-2">
            {data.globalPosts.map((post) => (
              <GlobalPostItem key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {data.sections.length === 0 && (
        <p className="py-8 text-center text-sm text-[--text-muted]">
          No classes found for the current semester.
        </p>
      )}

      {data.sections.map((sec) => {
        const categories = CATEGORIES
          .map(({ type, label }) => ({
            type,
            label,
            items: sec.resources.filter((r) => r.type === type),
          }))
          .filter((g) => g.items.length > 0)

        return (
          <ClassSectionCard
            key={sec.sectionId}
            sectionId={sec.sectionId}
            sectionCode={sec.sectionCode}
            room={sec.room}
            courseCode={sec.courseCode}
            courseTitle={sec.courseTitle}
            lecturerName={sec.lecturerName}
            posts={sec.posts}
            categories={categories}
          />
        )
      })}
    </div>
  )
}
