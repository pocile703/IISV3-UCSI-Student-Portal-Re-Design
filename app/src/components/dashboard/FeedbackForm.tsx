'use client'

import { useActionState, useRef, useEffect } from 'react'
import { MessageSquare, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { submitFeedback, type FeedbackFormState } from '@/app/(portal)/feedback/actions'

const INITIAL_STATE: FeedbackFormState = { status: 'idle' }

const INPUT_CLASS =
  'w-full rounded-lg border border-[--ucsi-border] px-3 py-2 text-sm text-[--text-primary] placeholder:text-[--text-muted] focus:border-[#C1272D] focus:outline-none focus:ring-2 focus:ring-[#C1272D]/20'
const INPUT_STYLE: React.CSSProperties = { backgroundColor: 'var(--bg-base)' }

export function FeedbackForm() {
  const [state, action, pending] = useActionState(submitFeedback, INITIAL_STATE)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.status === 'success') {
      formRef.current?.reset()
    }
  }, [state])

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-[--text-primary]">Submit New Feedback</h2>
      </CardHeader>
      <CardContent>
        {state.status === 'success' ? (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-950/20 dark:text-green-400">
            <CheckCircle size={16} aria-hidden="true" />
            Feedback submitted. We&apos;ll review it shortly.
          </div>
        ) : (
          <form ref={formRef} action={action} className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[--text-secondary]" htmlFor="fb-subject">
                Subject
              </label>
              <input
                id="fb-subject"
                name="subject"
                type="text"
                placeholder="Brief description of your feedback"
                required
                maxLength={255}
                className={INPUT_CLASS}
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[--text-secondary]" htmlFor="fb-body">
                Details
              </label>
              <textarea
                id="fb-body"
                name="body"
                rows={4}
                placeholder="Describe your feedback in detail…"
                required
                className={`${INPUT_CLASS} resize-none`}
                style={INPUT_STYLE}
              />
            </div>
            {state.status === 'error' && (
              <p role="alert" className="text-sm text-[#C1272D]">{state.message}</p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="flex w-fit cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C1272D]"
              style={{ backgroundColor: 'var(--ucsi-red)' }}
            >
              <MessageSquare size={14} aria-hidden="true" />
              {pending ? 'Submitting…' : 'Submit Feedback'}
            </button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
