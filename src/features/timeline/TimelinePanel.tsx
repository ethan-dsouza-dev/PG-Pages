import { useId, useRef, useState } from 'react'
import {
  clampToWindow,
  getTimelineWindow,
  getUntimedTasksForDay,
  getVisibleHours,
  groupTasksIntoRows,
  isTimed,
} from '../../domain/timeline'
import { formatDayLabel } from '../../domain/timelineFormat'
import type { Task } from '../../domain/types'
import {
  usePageMeta,
  usePGPageActions,
  useScheduledTasks,
  useShowFullDay,
  useTaskWindowActions,
} from '../../store/pgPageStore'
import { AddChip, Panel } from '../../ui'
import { AllDayPopover } from './AllDayPopover'
import { DAY_NAMES, type DayIndex } from './layout'
import { DeleteTaskDialog } from './DeleteTaskDialog'
import { CurrentTimeText } from './NowIndicator'
import { DayNav, WeekNav } from './TimelineNav'
import { TimelineScroller, type TimelineScrollerHandle } from './TimelineScroller'
import type { OpenPhaseHandler, RequestDeleteHandler } from './types'

/** Date label, week/day navigation, the scrollable timeline, and Add Timed Task. */
export function TimelinePanel() {
  const { timeZone } = usePageMeta()
  const tasks = useScheduledTasks()
  // The window is anchored when the page loads.
  // TODO: roll the window over at midnight once real data is wired in.
  const [anchor] = useState(() => new Date())
  const window = getTimelineWindow(anchor, timeZone)
  const [showFullDay, setShowFullDay] = useShowFullDay()
  const hours = getVisibleHours(window, tasks, showFullDay)
  // LP-3.11a: All Day and untimed tasks live behind the All Day button, not on the sheet.
  // Only tasks inside the three visible days get a row, so far-off tasks leave no empty rows.
  const rows = groupTasksIntoRows(tasks.filter((t) => isTimed(t) && clampToWindow(t, window) !== null))
  const fullDayId = useId()

  const [visibleDay, setVisibleDay] = useState<DayIndex>(1)
  const scrollerRef = useRef<TimelineScrollerHandle>(null)
  const { deleteTask } = usePGPageActions()
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null)
  const deleteTriggerRef = useRef<SVGElement | null>(null)

  const { openTaskWindow } = useTaskWindowActions()
  // TW-1.4: clicking a phase opens the task in the window, slid to that subphase.
  const handleOpenPhase: OpenPhaseHandler = (task, phase) =>
    openTaskWindow({ mode: 'edit', kind: 'task', taskId: task.id, phasePath: [phase.id] })

  const handleRequestDelete: RequestDeleteHandler = (task, trigger) => {
    deleteTriggerRef.current = trigger
    setPendingDelete(task)
  }

  const proceedDelete = () => {
    if (pendingDelete) deleteTask(pendingDelete.id)
    setPendingDelete(null)
  }

  return (
    <section aria-labelledby="timeline-date" className="flex flex-col gap-2">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div>
          <AllDayPopover
            tasks={getUntimedTasksForDay(tasks, window.days[visibleDay], timeZone)}
            dayName={DAY_NAMES[visibleDay]}
            dayLabel={formatDayLabel(window.days[visibleDay], timeZone)}
          />
        </div>
        <h2 id="timeline-date" className="text-center text-label font-medium">
          {formatDayLabel(window.days[visibleDay], timeZone)}
        </h2>
        <div className="flex items-center justify-end gap-2 text-label whitespace-nowrap">
          <input
            id={fullDayId}
            type="checkbox"
            checked={showFullDay}
            onChange={(e) => setShowFullDay(e.target.checked)}
            className="interactive size-5 accent-text"
          />
          <label htmlFor={fullDayId}>Show 24 hours</label>
        </div>
      </div>
      <Panel className="flex flex-col gap-3 px-12 pt-4 pb-6">
        <WeekNav />
        <DayNav visibleDay={visibleDay} onNavigate={(day) => scrollerRef.current?.scrollToDay(day)} />
        <CurrentTimeText />
        <TimelineScroller
          ref={scrollerRef}
          window={window}
          hours={hours}
          rows={rows}
          onVisibleDayChange={setVisibleDay}
          onOpenPhase={handleOpenPhase}
          onRequestDelete={handleRequestDelete}
        />
        <div className="flex items-center justify-end gap-4">
          <span aria-hidden="true" className="text-label">
            Add Timed Task
          </span>
          <AddChip
            label="Add Timed Task"
            size="compact"
            onClick={() => openTaskWindow({ mode: 'new', prefill: { kind: 'task', timing: 'timed' } })}
          />
        </div>
      </Panel>
      <DeleteTaskDialog
        task={pendingDelete}
        onProceed={proceedDelete}
        onCancel={() => setPendingDelete(null)}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          // After Proceed the bar is gone, so focus falls back to the scroller.
          const trigger = deleteTriggerRef.current
          if (trigger?.isConnected) trigger.focus()
          else scrollerRef.current?.focus()
        }}
      />
    </section>
  )
}
