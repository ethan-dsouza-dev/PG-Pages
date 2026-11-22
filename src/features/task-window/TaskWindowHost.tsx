import { useEffect, useState } from 'react'
import type { ItemForm } from '../../domain/taskForm'
import {
  useActivePage,
  useInstanceDialogRequest,
  useTaskWindowActions,
  useTaskWindowRequest,
  type InstanceDialogRequest,
  type TaskWindowRequest,
} from '../../store/pgPageStore'
import { InstanceDialog } from './InstanceDialog'
import { initialFormFor } from './initialForm'
import { TaskWindow } from './TaskWindow'

type Session = { request: TaskWindowRequest; initial: ItemForm | null; returnFocus: HTMLElement | null }

/** The element focus should return to: whatever had it when the window opened. */
const focused = () => (document.activeElement instanceof HTMLElement || document.activeElement instanceof SVGElement
  ? (document.activeElement as HTMLElement)
  : null)

/**
 * Mounts the task window and the instance dialog whenever something opens
 * them through the store. Rendered once, next to the page.
 */
export function TaskWindowHost() {
  const request = useTaskWindowRequest()
  const instanceRequest = useInstanceDialogRequest()
  const page = useActivePage()
  const { closeTaskWindow } = useTaskWindowActions()

  // A fresh session (form + focus return) for each request, set while rendering.
  const [seen, setSeen] = useState<TaskWindowRequest | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  if (request !== seen) {
    setSeen(request)
    setSession(request ? { request, initial: initialFormFor(request, page, new Date()), returnFocus: focused() } : null)
  }

  const [seenInstance, setSeenInstance] = useState<InstanceDialogRequest | null>(null)
  const [instanceFocus, setInstanceFocus] = useState<{ current: HTMLElement | null }>({ current: null })
  if (instanceRequest !== seenInstance) {
    setSeenInstance(instanceRequest)
    if (instanceRequest) setInstanceFocus({ current: focused() })
  }

  // The item was deleted before the window could open.
  const missing = session !== null && session.initial === null
  useEffect(() => {
    if (missing) closeTaskWindow()
  }, [missing, closeTaskWindow])

  return (
    <>
      {session?.initial && (
        <TaskWindow
          key={JSON.stringify(session.request)}
          request={session.request}
          initial={session.initial}
          returnFocus={session.returnFocus}
        />
      )}
      {instanceRequest && <InstanceDialog request={instanceRequest} returnFocus={instanceFocus} />}
    </>
  )
}
