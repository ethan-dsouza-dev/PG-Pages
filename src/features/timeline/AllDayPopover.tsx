import * as Popover from '@radix-ui/react-popover'
import { useId } from 'react'
import type { Task } from '../../domain/types'
import { cx } from '../../ui'

type AllDayPopoverProps = {
  /** That day's All Day and untimed tasks. */
  tasks: Task[]
  /** "Today", "Tomorrow"... names the day in the popover heading. */
  dayName: string
  /** "October 10th 2026" */
  dayLabel: string
}

const TIMING_LABEL = { 'all-day': 'All day', untimed: 'No set time' } as const

/**
 * LP-3.11a: All Day and untimed tasks stay off the time sheet. This button sits
 * outside the timeline panel and lists the visible day's ones in a popover.
 * The Calendar-view all-day strip comes with Calendar view.
 */
export function AllDayPopover({ tasks, dayName, dayLabel }: AllDayPopoverProps) {
  const headingId = useId()

  return (
    <Popover.Root>
      <Popover.Trigger className="interactive inline-block text-label underline underline-offset-4 decoration-2">
        All Day ({tasks.length})
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          aria-labelledby={headingId}
          align="start"
          sideOffset={8}
          className="z-10 flex w-96 max-w-[90vw] flex-col gap-3 rounded-panel border-2 border-border-strong bg-surface-panel p-6 font-body text-text shadow-lift outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <h3 id={headingId} className="text-label font-medium">
            All Day: {dayName}
            <span className="block text-meta font-normal">{dayLabel}</span>
          </h3>
          {tasks.length === 0 ? (
            <p className="text-meta italic">No All Day or untimed tasks.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {tasks.map((task) => (
                <li key={task.id} className="flex items-baseline justify-between gap-4 text-meta">
                  <span className={cx(task.completed && 'line-through')}>
                    {task.title}
                    <span className="sr-only">, {task.completed ? 'done' : 'to do'}</span>
                  </span>
                  <span className="shrink-0 text-caption">
                    {task.timing ? TIMING_LABEL[task.timing] : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
