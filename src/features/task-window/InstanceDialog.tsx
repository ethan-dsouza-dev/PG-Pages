import * as Dialog from '@radix-ui/react-dialog'
import { useId, useState, type FormEvent, type RefObject } from 'react'
import { taskKey, tasksForKey } from '../../domain/boardTasks'
import { toLocalDate, toLocalDateTime } from '../../domain/localTime'
import { formSpan, retimeValues } from '../../domain/taskForm'
import { describeOccurrence } from './describeOccurrence'
import type { Task, Timing } from '../../domain/types'
import { useActivePage, useTaskWindowActions, type InstanceDialogRequest } from '../../store/pgPageStore'
import { TextLink } from '../../ui'
import { inputClass, smallButtonClass } from './fieldContext'

type InstanceDialogProps = {
  request: InstanceDialogRequest
  returnFocus: RefObject<HTMLElement | null>
}

/** TW-6.1 "Create new instance" and TW-6.2 "See instances" for one task. */
export function InstanceDialog({ request, returnFocus }: InstanceDialogProps) {
  const page = useActivePage()
  const { closeInstanceDialog } = useTaskWindowActions()
  const task = page.tasks.find((t) => t.id === request.taskId)

  return (
    <Dialog.Root open onOpenChange={(open) => !open && closeInstanceDialog()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 bg-overlay" />
        <Dialog.Content
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            if (returnFocus.current?.isConnected) returnFocus.current.focus()
          }}
          className="fixed top-1/2 left-1/2 z-20 flex max-h-[85vh] w-144 max-w-[92vw] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-panel border-2 border-border-strong bg-surface-panel p-8 font-body text-text"
        >
          {!task ? (
            <>
              <Dialog.Title className="text-section">Task not found</Dialog.Title>
              <TextLink size="label" onClick={closeInstanceDialog}>
                Close
              </TextLink>
            </>
          ) : request.view === 'create' ? (
            <CreateInstanceForm task={task} timeZone={page.timeZone} />
          ) : (
            <InstanceList task={task} series={tasksForKey(page.tasks, taskKey(task)).reverse()} timeZone={page.timeZone} />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function CreateInstanceForm({ task, timeZone }: { task: Task; timeZone: string }) {
  const { createInstance, closeInstanceDialog } = useTaskWindowActions()
  const timing: Timing = task.timing ?? 'timed'
  const startId = useId()
  const endId = useId()
  // Default: the same time one day after this occurrence.
  const nextDay = (iso: string) => new Date(Date.parse(iso) + 86_400_000).toISOString()
  const initial =
    timing === 'timed'
      ? { start: toLocalDateTime(nextDay(task.start), timeZone), end: toLocalDateTime(nextDay(task.end), timeZone) }
      : retimeValues(toLocalDate(nextDay(task.start), timeZone), toLocalDate(nextDay(task.start), timeZone), 'all-day', timing)
  const [start, setStart] = useState(initial.start)
  const [end, setEnd] = useState(initial.end)
  const [error, setError] = useState<string | null>(null)
  const inputType = timing === 'timed' ? 'datetime-local' : 'date'

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const ok = start && (timing === 'untimed' || end) && (timing === 'untimed' || end >= start) && (timing !== 'timed' || end > start)
    if (!ok) {
      setError(timing === 'timed' ? 'End must be after start.' : 'The last day can’t be before the first.')
      return
    }
    const span = formSpan({ timing, start, end: timing === 'untimed' ? start : end }, timeZone)
    createInstance(task.id, span.start, span.end)
    closeInstanceDialog()
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div>
        <Dialog.Title className="text-section">New instance of {task.title}</Dialog.Title>
        <p className="text-meta">Adds another occurrence of this task to the schedule. Its details come along.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <label htmlFor={startId} className="flex flex-col gap-1 text-label">
          {timing === 'timed' ? 'Starts' : timing === 'all-day' ? 'First day' : 'Day'}
          <input id={startId} type={inputType} value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} />
        </label>
        {timing !== 'untimed' && (
          <label htmlFor={endId} className="flex flex-col gap-1 text-label">
            {timing === 'timed' ? 'Ends' : 'Last day'}
            <input id={endId} type={inputType} value={end} onChange={(e) => setEnd(e.target.value)} className={inputClass} />
          </label>
        )}
      </div>
      {error && <p className="border-l-4 border-error pl-2 text-meta">{error}</p>}
      <div className="flex justify-end gap-6">
        <TextLink size="label" onClick={closeInstanceDialog}>
          Cancel
        </TextLink>
        <button
          type="submit"
          className="interactive rounded-add border-2 border-border-strong bg-add px-6 py-1.5 text-label font-medium text-text-on-accent"
        >
          Add instance
        </button>
      </div>
    </form>
  )
}

function InstanceList({ task, series, timeZone }: { task: Task; series: Task[]; timeZone: string }) {
  const { closeInstanceDialog, openTaskWindow } = useTaskWindowActions()
  return (
    <div className="flex flex-col gap-4">
      <Dialog.Title className="text-section">Instances of {task.title}</Dialog.Title>
      <ul className="flex flex-col gap-2">
        {series.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-4 rounded-chip bg-surface-base px-3 py-1.5">
            <span className="text-label">
              {describeOccurrence(t, timeZone)}
              <span className="text-meta">
                {' '}
                · {t.completed ? 'done' : 'to do'}
                {t.unscheduled ? ', removed from schedule' : ''}
              </span>
            </span>
            <button
              type="button"
              className={smallButtonClass}
              aria-label={`Edit the ${describeOccurrence(t, timeZone)} occurrence`}
              onClick={() => {
                closeInstanceDialog()
                openTaskWindow({ mode: 'instance', taskId: t.id })
              }}
            >
              Edit
            </button>
          </li>
        ))}
      </ul>
      <div className="flex justify-end">
        <TextLink size="label" onClick={closeInstanceDialog}>
          Close
        </TextLink>
      </div>
    </div>
  )
}
