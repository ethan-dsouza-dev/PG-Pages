import * as ContextMenu from '@radix-ui/react-context-menu'
import { useRef, type ReactElement } from 'react'
import { isOnUpcomingSchedule } from '../../domain/taskActions'
import type { Task } from '../../domain/types'
import { useTaskWindowActions } from '../../store/pgPageStore'
import { cx } from '../../ui'
import { useNow } from './useNow'

/** What to do once the menu has closed and handed focus back. */
type PendingAction = 'edit' | 'instance' | 'instances' | 'duplicate' | 'remove' | 'delete'

type TaskContextMenuProps = {
  task: Task
  /** The task bar. Must accept a ref and forward contextmenu/keydown events. */
  children: ReactElement
  onRemove: () => void
  onRequestDelete: () => void
  /** Delete's label, e.g. "Delete all occurrences" on a board chip. */
  deleteLabel?: string
}

/**
 * Right-click (or Shift+F10 / the context-menu key) menu on a timeline task:
 * Edit, Create new instance, See instances, Duplicate, Remove, Delete.
 *
 * Remove and Delete run after the menu has closed (in onCloseAutoFocus), so
 * the bar is never unmounted under an open menu and the delete dialog does not
 * fight the menu for focus.
 */
export function TaskContextMenu({ task, children, onRemove, onRequestDelete, deleteLabel = 'Delete' }: TaskContextMenuProps) {
  const pending = useRef<PendingAction | null>(null)
  const { openTaskWindow, openInstanceDialog } = useTaskWindowActions()

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content
          aria-label={`Actions for ${task.title}`}
          // The keyboard shortcut can fire a native contextmenu on the focused item.
          onContextMenu={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => {
            const action = pending.current
            pending.current = null
            if (action === null) return
            event.preventDefault()
            // Windows open after the menu closed, so they hand focus back to the bar.
            if (action === 'edit') openTaskWindow({ mode: 'edit', kind: 'task', taskId: task.id })
            else if (action === 'duplicate') openTaskWindow({ mode: 'duplicate', kind: 'task', taskId: task.id })
            else if (action === 'instance') openInstanceDialog({ taskId: task.id, view: 'create' })
            else if (action === 'instances') openInstanceDialog({ taskId: task.id, view: 'list' })
            else if (action === 'remove') onRemove()
            else onRequestDelete()
          }}
          className="z-10 flex min-w-56 flex-col rounded-panel border-2 border-border-strong bg-surface-panel p-1 font-body text-label text-text shadow-lift"
        >
          <TaskMenuItems task={task} deleteLabel={deleteLabel} onPick={(action) => (pending.current = action)} />
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}

const itemClass = cx(
  'cursor-pointer rounded-chip px-3 py-1 outline-none select-none',
  'data-highlighted:bg-surface-base',
  'data-disabled:cursor-default data-disabled:opacity-50',
)

const WINDOW_ITEMS: { action: PendingAction; label: string }[] = [
  { action: 'edit', label: 'Edit' },
  { action: 'instance', label: 'Create new instance' },
  { action: 'instances', label: 'See instances' },
  { action: 'duplicate', label: 'Duplicate' },
]

type TaskMenuItemsProps = { task: Task; deleteLabel: string; onPick: (action: PendingAction) => void }

/** Mounted only while the menu is open, so `now` is fresh for every open. */
function TaskMenuItems({ task, deleteLabel, onPick }: TaskMenuItemsProps) {
  const now = useNow()
  const removable = isOnUpcomingSchedule(task, now)

  return (
    <>
      {WINDOW_ITEMS.map(({ action, label }) => (
        <ContextMenu.Item key={action} onSelect={() => onPick(action)} className={itemClass}>
          {label}
        </ContextMenu.Item>
      ))}
      <ContextMenu.Separator aria-hidden="true" className="mx-2 my-1 h-0.5 bg-border-strong" />
      <ContextMenu.Item
        disabled={!removable}
        title={removable ? undefined : 'Only upcoming tasks can be removed from the schedule'}
        onSelect={() => onPick('remove')}
        className={itemClass}
      >
        Remove
      </ContextMenu.Item>
      <ContextMenu.Item onSelect={() => onPick('delete')} className={itemClass}>
        {deleteLabel}
      </ContextMenu.Item>
    </>
  )
}
