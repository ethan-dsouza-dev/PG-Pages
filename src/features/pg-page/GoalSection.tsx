import * as ContextMenu from '@radix-ui/react-context-menu'
import { useId, useRef, useState, type ReactNode } from 'react'
import { toLocalMonth } from '../../domain/localTime'
import type { Goal, GoalScope } from '../../domain/types'
import { useGoals, usePageMeta, usePGPageActions, useTaskWindowActions } from '../../store/pgPageStore'
import { AddChip, Chip, cx, SectionHeading } from '../../ui'
import { ConfirmDialog } from '../task-window/ConfirmDialog'
import { useNow } from '../timeline/useNow'

type GoalSectionProps = {
  title: string
  scope: GoalScope
  /** Accessible name of the "+" button, e.g. "Add day goal". */
  addLabel: string
  /** Hide the whole section while it has no goals (week and year goals). */
  hideWhenEmpty?: boolean
}

/** A heading and a 4-column grid of goal chips ending in a "+" chip. */
export function GoalSection({ title, scope, addLabel, hideWhenEmpty = false }: GoalSectionProps) {
  const headingId = useId()
  const all = useGoals(scope)
  const { timeZone } = usePageMeta()
  const month = toLocalMonth(useNow().toISOString(), timeZone)
  // TW-3.3a: the themes section shows this month's themes.
  const goals = scope === 'theme' ? all.filter((g) => g.month === undefined || g.month === month) : all
  const { toggleGoal } = usePGPageActions()
  const { openTaskWindow } = useTaskWindowActions()
  if (hideWhenEmpty && goals.length === 0) return null

  const add = () =>
    openTaskWindow({
      mode: 'new',
      prefill: scope === 'theme' ? { kind: 'theme' } : { kind: 'goal', horizon: scope },
    })

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-5">
      <SectionHeading id={headingId}>{title}</SectionHeading>
      <ul className="grid grid-cols-4 gap-x-4 gap-y-5">
        {goals.map((goal) => (
          <li key={goal.id}>
            <GoalMenu goal={goal}>
              <Chip label={goal.title} completed={goal.completed} onToggle={() => toggleGoal(goal.id)} />
            </GoalMenu>
          </li>
        ))}
        <li>
          {/* LP-6.11: opens the New Task window on this section's tab. */}
          <AddChip label={addLabel} onClick={add} />
        </li>
      </ul>
    </section>
  )
}

const itemClass = cx(
  'cursor-pointer rounded-chip px-3 py-1 outline-none select-none',
  'data-highlighted:bg-surface-base',
)

type PendingAction = 'edit' | 'duplicate' | 'delete'

/** LP-4.5: right-click (or Shift+F10) on a goal or theme: Edit, Duplicate, Delete. */
function GoalMenu({ goal, children }: { goal: Goal; children: ReactNode }) {
  const { openTaskWindow, deleteGoal } = useTaskWindowActions()
  const pending = useRef<PendingAction | null>(null)
  const [confirming, setConfirming] = useState(false)
  const kind = goal.scope === 'theme' ? 'theme' : 'goal'

  return (
    <>
      <ContextMenu.Root>
        <ContextMenu.Trigger asChild>
          <div>{children}</div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content
            aria-label={`Actions for ${goal.title}`}
            onContextMenu={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => {
              const action = pending.current
              pending.current = null
              if (!action) return
              event.preventDefault()
              if (action === 'edit') openTaskWindow({ mode: 'edit', kind: 'goal', goalId: goal.id })
              else if (action === 'duplicate') openTaskWindow({ mode: 'duplicate', kind: 'goal', goalId: goal.id })
              else setConfirming(true)
            }}
            className="z-10 flex min-w-48 flex-col rounded-panel border-2 border-border-strong bg-surface-panel p-1 font-body text-label text-text shadow-lift"
          >
            <ContextMenu.Item className={itemClass} onSelect={() => (pending.current = 'edit')}>
              Edit
            </ContextMenu.Item>
            <ContextMenu.Item className={itemClass} onSelect={() => (pending.current = 'duplicate')}>
              Duplicate {kind}
            </ContextMenu.Item>
            <ContextMenu.Separator aria-hidden="true" className="mx-2 my-1 h-0.5 bg-border-strong" />
            <ContextMenu.Item className={itemClass} onSelect={() => (pending.current = 'delete')}>
              Delete
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu.Root>
      <ConfirmDialog
        open={confirming}
        title={`Delete this ${kind}?`}
        description={`“${goal.title}” will be permanently deleted.`}
        choices={[
          { label: 'Cancel', onSelect: () => setConfirming(false) },
          {
            label: 'Proceed',
            onSelect: () => {
              setConfirming(false)
              deleteGoal(goal.id)
            },
          },
        ]}
        onCancel={() => setConfirming(false)}
      />
    </>
  )
}
