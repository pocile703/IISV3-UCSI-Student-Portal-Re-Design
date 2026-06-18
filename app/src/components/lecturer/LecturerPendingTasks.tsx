'use client'

import { useActionState, useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Circle, CheckCircle2, Trash2, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { LecturerTask } from '@/types/lecturer-task'
import type { TaskState } from '@/app/(portal)/lecturer/actions'

interface LecturerPendingTasksProps {
  tasks: LecturerTask[]
  createAction: (_prev: TaskState, formData: FormData) => Promise<TaskState>
  toggleAction: (taskId: string) => Promise<TaskState>
  deleteAction: (taskId: string) => Promise<TaskState>
}

// Derive a human-readable due label and overdue flag from a YYYY-MM-DD string.
function getDueInfo(dueDate: string | null, isDone: boolean): { label: string; overdue: boolean } {
  if (!dueDate) return { label: '', overdue: false }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate + 'T00:00:00')
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000)
  if (diffDays < 0) return { label: 'Overdue', overdue: !isDone }
  if (diffDays === 0) return { label: 'Due today', overdue: false }
  if (diffDays === 1) return { label: 'Due tomorrow', overdue: false }
  if (diffDays <= 7) return { label: 'This week', overdue: false }
  return { label: 'Next week', overdue: false }
}

// Per-row component so each row has its own useTransition (React hooks rule: no hooks in .map).
function TaskRow({
  task,
  toggleAction,
  deleteAction,
}: {
  task: LecturerTask
  toggleAction: (id: string) => Promise<TaskState>
  deleteAction: (id: string) => Promise<TaskState>
}) {
  const router = useRouter()
  const [isTogglingPending, startToggle] = useTransition()
  const [isDeletingPending, startDelete] = useTransition()
  // Optimistic isDone so the checkbox flips immediately without waiting for revalidatePath.
  const [optimisticDone, setOptimisticDone] = useState(task.isDone)

  const { label, overdue } = getDueInfo(task.dueDate, optimisticDone)
  const isPending = isTogglingPending || isDeletingPending

  function handleToggle() {
    setOptimisticDone((prev) => !prev)
    startToggle(async () => {
      const result = await toggleAction(task.id)
      if (!result.success) setOptimisticDone(task.isDone) // rollback on error
      else router.refresh()
    })
  }

  function handleDelete() {
    startDelete(async () => {
      await deleteAction(task.id)
      router.refresh()
    })
  }

  return (
    <div
      className={`group flex items-center gap-3 py-3 transition-opacity ${optimisticDone ? 'opacity-50' : ''}`}
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        aria-label={optimisticDone ? 'Mark as incomplete' : 'Mark as done'}
        className="shrink-0 cursor-pointer text-[--text-muted] transition-colors hover:text-[#C1272D] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red] rounded"
      >
        {optimisticDone ? <CheckCircle2 size={17} /> : <Circle size={17} />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={`text-sm text-[--text-primary] ${optimisticDone ? 'line-through' : ''}`}>
          {task.text}
        </p>
        {task.context && (
          <p className="mt-0.5 text-xs text-[--text-secondary]">{task.context}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {optimisticDone ? (
          <span className="text-xs text-[--text-secondary]">Done</span>
        ) : overdue ? (
          <Badge variant="danger">{label}</Badge>
        ) : label ? (
          <span className="text-xs text-[--text-secondary]">{label}</span>
        ) : null}

        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          aria-label={`Delete task: ${task.text}`}
          className="hidden group-hover:flex shrink-0 items-center justify-center rounded p-1 text-[--text-muted] transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          {isDeletingPending ? (
            <span className="text-[10px]">…</span>
          ) : (
            <Trash2 size={13} />
          )}
        </button>
      </div>
    </div>
  )
}

// Inline "Add task" form at the bottom of the list.
function AddTaskForm({
  createAction,
}: {
  createAction: (_prev: TaskState, formData: FormData) => Promise<TaskState>
}) {
  const [state, dispatch, isPending] = useActionState(createAction, {})
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // Close and refresh after a successful create.
  // Use a ref-based pattern: track the last-seen success value.
  const [prevSuccess, setPrevSuccess] = useState(false)
  if (state.success && !prevSuccess) {
    setPrevSuccess(true)
    setOpen(false)
    router.refresh()
  }
  if (!state.success && prevSuccess) setPrevSuccess(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-xs text-[--text-muted] transition-colors hover:bg-zinc-100 hover:text-[#C1272D] dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]"
      >
        <Plus size={13} />
        Add task
      </button>
    )
  }

  return (
    <form action={dispatch} className="mt-2 flex flex-col gap-2 rounded-lg border border-[--ucsi-border] p-3">
      <input
        name="text"
        type="text"
        required
        placeholder="Task description…"
        maxLength={500}
        autoFocus
        suppressHydrationWarning
        className="w-full rounded-md border border-[--ucsi-border] px-2.5 py-1.5 text-sm text-[--text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      />
      <div className="flex gap-2">
        <input
          name="context"
          type="text"
          placeholder="Context (e.g. HCI · DIT7044)"
          maxLength={200}
          suppressHydrationWarning
          className="min-w-0 flex-1 rounded-md border border-[--ucsi-border] px-2.5 py-1.5 text-xs text-[--text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        />
        <input
          name="dueDate"
          type="date"
          suppressHydrationWarning
          className="rounded-md border border-[--ucsi-border] px-2 py-1.5 text-xs text-[--text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--ucsi-red]"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        />
      </div>
      {state.error && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md px-3 py-1.5 text-xs text-[--text-secondary] transition-colors hover:bg-zinc-100 dark:hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ backgroundColor: 'var(--ucsi-red)' }}
        >
          {isPending ? 'Adding…' : 'Add'}
        </button>
      </div>
    </form>
  )
}

export function LecturerPendingTasks({
  tasks,
  createAction,
  toggleAction,
  deleteAction,
}: LecturerPendingTasksProps) {
  return (
    <div className="flex flex-col">
      {tasks.length === 0 ? (
        <p className="py-4 text-center text-sm text-[--text-muted]">No pending tasks.</p>
      ) : (
        <div className="flex flex-col divide-y divide-[--ucsi-border]">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              toggleAction={toggleAction}
              deleteAction={deleteAction}
            />
          ))}
        </div>
      )}
      <AddTaskForm createAction={createAction} />
    </div>
  )
}
