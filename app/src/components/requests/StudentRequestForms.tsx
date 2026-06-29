'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { CheckCircle, PlusCircle, ArrowRightLeft } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import {
  submitAddDropRequest,
  submitProgressionRequest,
  type RequestFormState,
} from '@/app/(portal)/requests/actions'
import type { SectionOption, SemesterOption } from '@/types/requests'

const INITIAL: RequestFormState = { status: 'idle' }

const INPUT_CLASS =
  'w-full rounded-lg border border-[--ucsi-border] px-3 py-2 text-sm text-[--text-primary] placeholder:text-[--text-muted] focus:border-[#C1272D] focus:outline-none focus:ring-2 focus:ring-[#C1272D]/20'
const INPUT_STYLE: React.CSSProperties = { backgroundColor: 'var(--bg-base)' }

const LABEL_CLASS = 'mb-1 block text-xs font-medium text-[--text-secondary]'

function SubmitButton({ pending, label, pendingLabel }: { pending: boolean; label: string; pendingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-fit cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C1272D]"
      style={{ backgroundColor: 'var(--ucsi-red)' }}
    >
      {pending ? pendingLabel : label}
    </button>
  )
}

function SuccessBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-950/20 dark:text-green-400">
      <CheckCircle size={16} aria-hidden="true" />
      {children}
    </div>
  )
}

// ─── Add / Drop form ─────────────────────────────────────────────────────────

function AddDropForm({
  addableSections,
  droppableSections,
}: {
  addableSections: SectionOption[]
  droppableSections: SectionOption[]
}) {
  const [state, action, pending] = useActionState(submitAddDropRequest, INITIAL)
  const [requestAction, setRequestAction] = useState<'add' | 'drop'>('add')
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.status === 'success') formRef.current?.reset()
  }, [state])

  const sections = requestAction === 'add' ? addableSections : droppableSections
  const noOptions = sections.length === 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PlusCircle size={15} className="text-[--text-secondary]" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-[--text-primary]">Request to Add or Drop a Class</h2>
        </div>
      </CardHeader>
      <CardContent>
        {state.status === 'success' ? (
          <SuccessBanner>Your add/drop request has been submitted for review.</SuccessBanner>
        ) : (
          <form ref={formRef} action={action} className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLASS} htmlFor="ad-action">Action</label>
                <select
                  id="ad-action"
                  name="action"
                  value={requestAction}
                  onChange={(e) => setRequestAction(e.target.value as 'add' | 'drop')}
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                  suppressHydrationWarning
                >
                  <option value="add">Add a class</option>
                  <option value="drop">Drop a class</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS} htmlFor="ad-section">Class</label>
                <select
                  id="ad-section"
                  name="courseSectionId"
                  required
                  disabled={noOptions}
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                  suppressHydrationWarning
                >
                  {noOptions ? (
                    <option value="">
                      {requestAction === 'add' ? 'No classes available to add' : 'No enrolled classes to drop'}
                    </option>
                  ) : (
                    <>
                      <option value="">Select a class…</option>
                      {sections.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </div>
            <div>
              <label className={LABEL_CLASS} htmlFor="ad-reason">Reason <span className="text-[--text-muted]">(optional)</span></label>
              <textarea
                id="ad-reason"
                name="reason"
                rows={3}
                maxLength={2000}
                placeholder="Why are you requesting this change?"
                className={`${INPUT_CLASS} resize-none`}
                style={INPUT_STYLE}
              />
            </div>
            {state.status === 'error' && (
              <p role="alert" className="text-sm text-[#C1272D]">{state.message}</p>
            )}
            <SubmitButton pending={pending} label="Submit Request" pendingLabel="Submitting…" />
          </form>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Progression form ─────────────────────────────────────────────────────────

function ProgressionForm({
  currentSemesterId,
  currentSemesterName,
  targets,
}: {
  currentSemesterId: string | null
  currentSemesterName: string | null
  targets: SemesterOption[]
}) {
  const [state, action, pending] = useActionState(submitProgressionRequest, INITIAL)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.status === 'success') formRef.current?.reset()
  }, [state])

  const canSubmit = currentSemesterId !== null && targets.length > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ArrowRightLeft size={15} className="text-[--text-secondary]" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-[--text-primary]">Request Semester Progression</h2>
        </div>
      </CardHeader>
      <CardContent>
        {state.status === 'success' ? (
          <SuccessBanner>Your progression request has been submitted for review.</SuccessBanner>
        ) : !canSubmit ? (
          <p className="py-2 text-sm text-[--text-muted]">
            Semester progression requests are unavailable — no current semester or target semester is set for your programme.
          </p>
        ) : (
          <form ref={formRef} action={action} className="flex flex-col gap-3">
            <input type="hidden" name="fromSemesterId" value={currentSemesterId} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLASS} htmlFor="pr-from">Current Semester</label>
                <input
                  id="pr-from"
                  type="text"
                  value={currentSemesterName ?? ''}
                  readOnly
                  className={`${INPUT_CLASS} opacity-70`}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label className={LABEL_CLASS} htmlFor="pr-to">Target Semester</label>
                <select
                  id="pr-to"
                  name="toSemesterId"
                  required
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                  suppressHydrationWarning
                >
                  <option value="">Select a semester…</option>
                  {targets.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={LABEL_CLASS} htmlFor="pr-reason">Reason</label>
              <textarea
                id="pr-reason"
                name="reason"
                rows={3}
                required
                maxLength={2000}
                placeholder="Explain why you are requesting progression…"
                className={`${INPUT_CLASS} resize-none`}
                style={INPUT_STYLE}
              />
            </div>
            {state.status === 'error' && (
              <p role="alert" className="text-sm text-[#C1272D]">{state.message}</p>
            )}
            <SubmitButton pending={pending} label="Submit Request" pendingLabel="Submitting…" />
          </form>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Public wrapper ────────────────────────────────────────────────────────────

export function StudentRequestForms({
  addableSections,
  droppableSections,
  currentSemesterId,
  currentSemesterName,
  progressionTargets,
}: {
  addableSections: SectionOption[]
  droppableSections: SectionOption[]
  currentSemesterId: string | null
  currentSemesterName: string | null
  progressionTargets: SemesterOption[]
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <AddDropForm addableSections={addableSections} droppableSections={droppableSections} />
      <ProgressionForm
        currentSemesterId={currentSemesterId}
        currentSemesterName={currentSemesterName}
        targets={progressionTargets}
      />
    </div>
  )
}
