import { useImperativeHandle, useLayoutEffect, useRef, type KeyboardEvent, type Ref } from 'react'
import type { TimelineWindow } from '../../domain/timeline'
import type { Task } from '../../domain/types'
import { useElementSize, usePrefersReducedMotion } from '../../ui'
import { clampDay, timelineHeight, TIMELINE, type DayIndex } from './layout'
import { TimelineSvg } from './TimelineSvg'
import type { OpenPhaseHandler } from './types'

export type TimelineScrollerHandle = {
  scrollToDay: (day: DayIndex) => void
}

type TimelineScrollerProps = {
  window: TimelineWindow
  rows: Task[][]
  onVisibleDayChange: (day: DayIndex) => void
  onOpenPhase: OpenPhaseHandler
  ref?: Ref<TimelineScrollerHandle>
}

/**
 * Horizontal scroller over the three days. Each day is narrower than the
 * viewport so slivers of its neighbors stay visible; scroll-snap centers a day.
 */
export function TimelineScroller({
  window,
  rows,
  onVisibleDayChange,
  onOpenPhase,
  ref,
}: TimelineScrollerProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const currentDay = useRef<DayIndex>(1)
  const [measureRef, { width }] = useElementSize<HTMLDivElement>()
  const reducedMotion = usePrefersReducedMotion()
  const dayWidth = Math.round(width * TIMELINE.dayWidthRatio)

  const setScrollerRef = (el: HTMLDivElement | null) => {
    scrollerRef.current = el
    measureRef(el)
  }

  const scrollLeftFor = (day: DayIndex) =>
    Math.max(0, Math.min(dayWidth * 3 - width, day * dayWidth + dayWidth / 2 - width / 2))

  const scrollToDay = (day: DayIndex) => {
    scrollerRef.current?.scrollTo({
      left: scrollLeftFor(day),
      behavior: reducedMotion ? 'auto' : 'smooth',
    })
  }

  useImperativeHandle(ref, () => ({ scrollToDay }))

  // Start on (and stay on, across resizes) the current day without animating.
  useLayoutEffect(() => {
    if (dayWidth > 0 && scrollerRef.current) {
      const day = currentDay.current
      scrollerRef.current.scrollLeft = Math.max(
        0,
        Math.min(dayWidth * 3 - width, day * dayWidth + dayWidth / 2 - width / 2),
      )
    }
  }, [dayWidth, width])

  const handleScroll = () => {
    const el = scrollerRef.current
    if (!el || dayWidth === 0) return
    const day = clampDay(Math.round((el.scrollLeft + width / 2 - dayWidth / 2) / dayWidth))
    if (day !== currentDay.current) {
      currentDay.current = day
      onVisibleDayChange(day)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Only when the scroller itself is focused, so arrow keys on bars stay untouched.
    if (event.target !== event.currentTarget) return
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    scrollToDay(clampDay(currentDay.current + (event.key === 'ArrowLeft' ? -1 : 1)))
  }

  return (
    <div
      ref={setScrollerRef}
      tabIndex={0}
      role="region"
      aria-label="Timeline days. Use the left and right arrow keys to change day."
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
      style={{ height: timelineHeight(rows.length) }}
      className="snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-focus-ring"
    >
      {dayWidth > 0 && (
        <div className="relative" style={{ width: dayWidth * 3 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 snap-center"
              style={{ left: i * dayWidth, width: dayWidth }}
            />
          ))}
          <TimelineSvg window={window} rows={rows} dayWidth={dayWidth} onOpenPhase={onOpenPhase} />
        </div>
      )}
    </div>
  )
}
