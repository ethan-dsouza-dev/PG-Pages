import { TZDate } from '@date-fns/tz'
import { addDays, startOfDay } from 'date-fns'
import { scaleTime, type ScaleTime } from 'd3-scale'
import type { Task, TimeSpan } from './types'

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

/**
 * Maps time to x. Each day gets exactly `dayWidthPx`, so day boundaries line up
 * with scroll-snap points even on 23h/25h DST days.
 */
export function createTimeScale(
  window: TimelineWindow,
  dayWidthPx: number,
): ScaleTime<number, number> {
  const [yesterday, today, tomorrow] = window.days
  return scaleTime()
    .domain([yesterday, today, tomorrow, window.end])
    .range([0, dayWidthPx, dayWidthPx * 2, dayWidthPx * 3])
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
