import { useId, useRef, useState } from 'react'
import {
  getTimelineWindow,
  getUntimedTasksForDay,
  getVisibleHours,
  groupTasksIntoRows,
  isTimed,
} from '../../domain/timeline'
import { formatDayLabel } from '../../domain/timelineFormat'
import { usePageMeta, useShowFullDay, useTasks } from '../../store/pgPageStore'
import { AddChip, Panel } from '../../ui'
import { AllDayPopover } from './AllDayPopover'
import type { DayIndex } from './layout'
import { CurrentTimeText } from './NowIndicator'
import { PhaseDetail, type OpenPhase } from './PhaseDetail'
import { DAY_NAMES, DayNav, WeekNav } from './TimelineNav'
import { TimelineScroller, type TimelineScrollerHandle } from './TimelineScroller'
import type { OpenPhaseHandler } from './types'

/** Date label, week/day navigation, the scrollable timeline, and Add Timed Task. */
export function TimelinePanel() {
  const { timeZone } = usePageMeta()
  const tasks = useTasks()
  // The window is anchored when the page loads.
  // TODO: roll the window over at midnight once real data is wired in.
  const [anchor] = useState(() => new Date())
  const window = getTimelineWindow(anchor, timeZone)
  const [showFullDay, setShowFullDay] = useShowFullDay()
  const hours = getVisibleHours(window, tasks, showFullDay)
  // LP-3.11a: All Day and untimed tasks live behind the All Day button, not on the sheet.
  const rows = groupTasksIntoRows(tasks.filter(isTimed))
  const fullDayId = useId()

  const [visibleDay, setVisibleDay] = useState<DayIndex>(1)
  const [openPhase, setOpenPhase] = useState<OpenPhase | null>(null)
  const scrollerRef = useRef<TimelineScrollerHandle>(null)
  const phaseTriggerRef = useRef<SVGElement | null>(null)

  const handleOpenPhase: OpenPhaseHandler = (phase, taskTitle, trigger) => {
    phaseTriggerRef.current = trigger
    setOpenPhase({ phase, taskTitle })
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
        />
        <div className="flex items-center justify-end gap-4">
          <span aria-hidden="true" className="text-label">
            Add Timed Task
          </span>
          {/* PLACEHOLDER(05): creating tasks is out of scope. */}
          <AddChip label="Add Timed Task" size="compact" placeholder />
        </div>
      </Panel>
      <PhaseDetail
        open={openPhase}
        window={window}
        onClose={() => setOpenPhase(null)}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          phaseTriggerRef.current?.focus()
        }}
      />
    </section>
  )
}
