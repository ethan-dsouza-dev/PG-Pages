import * as ContextMenu from '@radix-ui/react-context-menu'
import { useRef, type ReactElement } from 'react'
import { isOnUpcomingSchedule } from '../../domain/taskActions'
import type { Task } from '../../domain/types'
import { cx } from '../../ui'
import { ComingSoonHint } from '../../ui/ComingSoonHint'
import { logPlaceholder, placeholderAttrs } from '../../ui/placeholder'
import { useNow } from './useNow'

/** What to do once the menu has closed and handed focus back. */
type PendingAction = 'remove' | 'delete'

type TaskContextMenuProps = {
  task: Task
  /** The task bar. Must accept a ref and forward contextmenu/keydown events. */
  children: ReactElement
  onRemove: () => void
  onRequestDelete: () => void
}

/**
 * Right-click (or Shift+F10 / the context-menu key) menu on a timeline task:
 * Edit, Create new instance, Duplicate, Remove, Delete.
 *
 * Remove and Delete run after the menu has closed (in onCloseAutoFocus), so
 * the bar is never unmounted under an open menu and the delete dialog does not
 * fight the menu for focus.
 */
export function TaskContextMenu({ task, children, onRemove, onRequestDelete }: TaskContextMenuProps) {
  const pending = useRef<PendingAction | null>(null)

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
            if (action === 'remove') onRemove()
            else onRequestDelete()
          }}
          className="z-10 flex min-w-56 flex-col rounded-panel border-2 border-border-strong bg-surface-panel p-1 font-body text-label text-text shadow-lift"
        >
          <TaskMenuItems task={task} onPick={(action) => (pending.current = action)} />
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

// PLACEHOLDER(task-window): Edit, Create new instance, and Duplicate open the
// New/Edit Task window, which has no spec yet.
const PLACEHOLDER_ITEMS = ['Edit', 'Create new instance', 'Duplicate'] as const

/** Mounted only while the menu is open, so `now` is fresh for every open. */
function TaskMenuItems({ task, onPick }: { task: Task; onPick: (action: PendingAction) => void }) {
  const now = useNow()
  const removable = isOnUpcomingSchedule(task, now)

  return (
    <>
      {PLACEHOLDER_ITEMS.map((label) => (
        <ContextMenu.Item
          key={label}
          {...placeholderAttrs}
          onSelect={() => logPlaceholder(label)}
          className={itemClass}
        >
          {label}
          <ComingSoonHint />
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
        Delete
      </ContextMenu.Item>
    </>
  )
}
