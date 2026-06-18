import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { FeedbackForm } from '@/components/dashboard/FeedbackForm'
import { getFeedbackData } from '@/services/feedback-queries'
import { formatDate } from '@/lib/utils'
import type { FeedbackStatus } from '@/types/feedback'

import { auth } from '@/auth'
import { redirect } from 'next/navigation'

const STATUS_VARIANT: Record<FeedbackStatus, 'success' | 'warning' | 'info' | 'neutral'> = {
  submitted:    'info',
  under_review: 'warning',
  resolved:     'success',
  closed:       'neutral',
}

const STATUS_LABEL: Record<FeedbackStatus, string> = {
  submitted:    'Submitted',
  under_review: 'Under Review',
  resolved:     'Resolved',
  closed:       'Closed',
}

export default async function FeedbackPage() {
  const session = await auth()
  const studentId = session?.user?.studentId
  if (!studentId) redirect('/login')
  const feedback = await getFeedbackData(studentId)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[--text-primary]">Feedback</h1>
          <p className="mt-0.5 text-sm text-[--text-secondary]">Submit and track your feedback</p>
        </div>
      </div>

      {/* TODO Phase 5: wire FeedbackForm to a Server Action for real submission */}
      <FeedbackForm />

      {/* History */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-[--text-primary]">My Feedback History</h2>
        </CardHeader>
        <CardContent>
          {feedback.length === 0 ? (
            <p className="py-4 text-center text-sm text-[--text-muted]">No feedback submitted yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-[--ucsi-border]">
              {feedback.map((fb) => (
                <div key={fb.id} className="py-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-[--text-primary]">{fb.subject}</p>
                    <Badge variant={STATUS_VARIANT[fb.status]}>{STATUS_LABEL[fb.status]}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[--text-secondary] line-clamp-2">{fb.body}</p>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-[--text-secondary]">
                    <span>Submitted {formatDate(fb.createdAt)}</span>
                    {fb.resolvedAt && (
                      <span>{fb.status === 'closed' ? 'Closed' : 'Resolved'} {formatDate(fb.resolvedAt)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
