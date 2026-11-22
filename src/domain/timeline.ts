import { TZDate } from '@date-fns/tz'
import { addDays, startOfDay } from 'date-fns'
import type { HourRange, Task, TimeSpan } from './types'

/** Yesterday 00:00 → tomorrow 24:00 in the page's time zone. */
export type TimelineWindow = {
  start: Date
  end: Date
  /** Midnight of yesterday, today, and tomorrow. */
  days: [Date, Date, Date]
  timeZone: string
}

export function getTimelineWindow(now: Date, timeZone: string): TimelineWindow {
  const today = startOfDay(new TZDate(now, timeZone))
  const yesterday = toPlainDate(addDays(today, -1))
  return {
    start: yesterday,
    end: toPlainDate(addDays(today, 2)),
    days: [yesterday, toPlainDate(today), toPlainDate(addDays(today, 1))],
    timeZone,
  }
}

/** TZDate is needed for zone-aware math, but callers get plain Dates. */
function toPlainDate(date: Date): Date {
  return new Date(date.getTime())
}

/** LP-3.5: each day shows 08:00–22:00 unless a task needs more. */
export const DEFAULT_HOURS: HourRange = { startHour: 8, endHour: 22 }
/** LP-3.7: the "Show 24 hours" range. */
export const FULL_DAY_HOURS: HourRange = { startHour: 0, endHour: 24 }

/** Timed tasks are drawn on the time sheet; All Day and untimed ones are not (LP-3.11a). */
export function isTimed(task: Task): boolean {
  return task.timing === undefined
}

/** `hour` o'clock (0–24) on the page-zone day containing `day`. 24 is the next midnight. */
export function hourOnDay(day: Date, hour: number, timeZone: string): Date {
  const midnight = startOfDay(new TZDate(day, timeZone))
  if (hour >= 24) return toPlainDate(addDays(midnight, 1))
  const time = new TZDate(midnight.getTime(), timeZone)
  time.setHours(hour)
  return toPlainDate(time)
}

/** Wall-clock hours since local midnight, e.g. 7.5 for 07:30. */
function wallClockHours(time: Date, timeZone: string): number {
  const z = new TZDate(time, timeZone)
  return z.getHours() + z.getMinutes() / 60 + z.getSeconds() / 3600 + z.getMilliseconds() / 3_600_000
}

/**
 * LP-3.6: the hours one day needs. Starts from `base` and grows, in whole hours,
 * to include every timed task start or end that falls on that day. Each start
 * or end keeps at least the hour next to it visible, so a task starting at 22:00
 * or ending at 08:00 still shows a sliver. Tasks that merely pass through the
 * day (started earlier, end later) don't extend it, or every multi-day task
 * would force 24 hours.
 */
export function getDayHours(
  day: Date,
  tasks: Task[],
  timeZone: string,
  base: HourRange = DEFAULT_HOURS,
): HourRange {
  const bounds = getDayBounds(day, timeZone)
  let { startHour, endHour } = base

  for (const task of tasks) {
    if (!isTimed(task)) continue
    const start = new Date(task.start)
    const end = new Date(task.end)
    if (end <= start) continue

    if (start >= bounds.start && start < bounds.end) {
      const h = Math.floor(wallClockHours(start, timeZone))
      startHour = Math.min(startHour, h)
      endHour = Math.max(endHour, h + 1)
    }
    if (end > bounds.start && end <= bounds.end) {
      // Ending exactly at the next midnight is 24:00 of this day.
      const h = end.getTime() === bounds.end.getTime() ? 24 : Math.ceil(wallClockHours(end, timeZone))
      endHour = Math.max(endHour, h)
      startHour = Math.min(startHour, h - 1)
    }
  }
  return { startHour, endHour }
}

/**
 * The hours every day in the window shows. All three days share one range (the
 * union of each day's needs) so a given hour sits at the same x in every day and
 * neighboring slivers line up. `showFullDay` (LP-3.7) overrides everything.
 */
export function getVisibleHours(
  window: TimelineWindow,
  tasks: Task[],
  showFullDay: boolean,
): HourRange {
  if (showFullDay) return FULL_DAY_HOURS
  return window.days
    .map((day) => getDayHours(day, tasks, window.timeZone))
    .reduce((a, b) => ({
      startHour: Math.min(a.startHour, b.startHour),
      endHour: Math.max(a.endHour, b.endHour),
    }))
}

/** The visible stretch of each day: `hours.startHour` to `hours.endHour`, page-zone wall clock. */
export function getVisibleSpans(
  window: TimelineWindow,
  hours: HourRange,
): { start: Date; end: Date }[] {
  return window.days.map((day) => ({
    start: hourOnDay(day, hours.startHour, window.timeZone),
    end: hourOnDay(day, hours.endHour, window.timeZone),
  }))
}

export type TimeScale = (time: Date) => number

/**
 * Maps time to x. Each day's visible hours get exactly `dayWidthPx`, so day
 * boundaries line up with scroll-snap points whatever the range, and on
 * 23h/25h DST days. Hidden hours collapse onto the nearest day edge; times
 * outside the window clamp to its ends.
 */
export function createTimeScale(
  window: TimelineWindow,
  hours: HourRange,
  dayWidthPx: number,
): TimeScale {
  const spans = getVisibleSpans(window, hours).map(({ start, end }) => [start.getTime(), end.getTime()])
  return (time) => {
    const t = time.getTime()
    for (let i = 0; i < spans.length; i++) {
      const [start, end] = spans[i]
      if (t <= start) return i * dayWidthPx
      if (t < end) return i * dayWidthPx + ((t - start) / (end - start)) * dayWidthPx
    }
    return spans.length * dayWidthPx
  }
}

/** Whether `time` falls inside one of the window's visible stretches. */
export function isTimeVisible(time: Date, window: TimelineWindow, hours: HourRange): boolean {
  return getVisibleSpans(window, hours).some(({ start, end }) => time >= start && time < end)
}

/** That day's All Day and untimed tasks, in fixture order (LP-3.11a). */
export function getUntimedTasksForDay(tasks: Task[], day: Date, timeZone: string): Task[] {
  const bounds = getDayBounds(day, timeZone)
  return tasks.filter((task) => !isTimed(task) && overlaps(task, bounds))
}

export type ClampedSpan = {
  start: Date
  end: Date
  /** The span begins before the window, so its left edge is clipped. */
  startsBefore: boolean
  /** The span ends after the window, so its right edge is clipped. */
  endsAfter: boolean
}

/** The visible part of a span, or null when it lies entirely outside the window. */
export function clampToWindow(span: TimeSpan, window: TimelineWindow): ClampedSpan | null {
  const start = new Date(span.start)
  const end = new Date(span.end)
  if (end <= window.start || start >= window.end) return null

  const startsBefore = start < window.start
  const endsAfter = end > window.end
  return {
    start: startsBefore ? window.start : start,
    end: endsAfter ? window.end : end,
    startsBefore,
    endsAfter,
  }
}

/** Tasks sharing a `seriesId` go in one row; every other task gets its own row. */
export function groupTasksIntoRows(tasks: Task[]): Task[][] {
  const rows: Task[][] = []
  const rowBySeries = new Map<string, Task[]>()

  for (const task of tasks) {
    if (task.seriesId === undefined) {
      rows.push([task])
      continue
    }
    const row = rowBySeries.get(task.seriesId)
    if (row) {
      row.push(task)
    } else {
      const newRow = [task]
      rowBySeries.set(task.seriesId, newRow)
      rows.push(newRow)
    }
  }
  return rows
}

/** Midnight-to-midnight bounds of the day containing `day`, in `timeZone`. */
export function getDayBounds(day: Date, timeZone: string): { start: Date; end: Date } {
  const start = startOfDay(new TZDate(day, timeZone))
  return { start: toPlainDate(start), end: toPlainDate(addDays(start, 1)) }
}

export function overlaps(span: TimeSpan, bounds: { start: Date; end: Date }): boolean {
  return new Date(span.start) < bounds.end && new Date(span.end) > bounds.start
}
