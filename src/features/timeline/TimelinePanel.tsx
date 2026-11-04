import { useRef, useState } from 'react'
import { getTimelineWindow, groupTasksIntoRows } from '../../domain/timeline'
import { formatDayLabel } from '../../domain/timelineFormat'
import { usePageMeta, useTasks } from '../../store/pgPageStore'
import { AddChip, Panel } from '../../ui'
import type { DayIndex } from './layout'
import { CurrentTimeText } from './NowIndicator'
import { PhaseDetail, type OpenPhase } from './PhaseDetail'
import { DayNav, WeekNav } from './TimelineNav'
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
  const rows = groupTasksIntoRows(tasks)

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
      <h2 id="timeline-date" className="text-center text-label font-medium">
        {formatDayLabel(window.days[visibleDay], timeZone)}
      </h2>
      <Panel className="flex flex-col gap-3 px-12 pt-4 pb-6">
        <WeekNav />
        <DayNav visibleDay={visibleDay} onNavigate={(day) => scrollerRef.current?.scrollToDay(day)} />
        <CurrentTimeText />
        <TimelineScroller
          ref={scrollerRef}
          window={window}
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
