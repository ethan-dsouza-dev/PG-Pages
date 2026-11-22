import { TZDate, tzOffset } from '@date-fns/tz'
import { format, isValid, parse } from 'date-fns'
import { resetDay } from './dayActions'
import type { Goal, PGPage } from './types'

/*
 * LP-5.2 / LP-5.3: every PG Page has a local reset time (default 12:00 am).
 * Each time the page's wall clock passes it, Done tasks, day goals and themes go
 * back to unchecked; month goals do so only at the first reset of a new month. All time math runs in the page's IANA time zone.
 */

/** Wall-clock time of day as "HH:mm" (24h), the format of `<input type="time">`. */
export type ResetTime = string

export const DEFAULT_RESET_TIME: ResetTime = '00:00'

const RESET_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export function isResetTime(value: string): value is ResetTime {
  return RESET_TIME_PATTERN.test(value)
}

function parseResetTime(resetTime: ResetTime): { hours: number; minutes: number } {
  if (!isResetTime(resetTime)) throw new Error(`Invalid reset time "${resetTime}"`)
  const [hours, minutes] = resetTime.split(':').map(Number)
  return { hours, minutes }
}

const MINUTE_MS = 60_000
const DAY_MS = 24 * 60 * MINUTE_MS

/**
 * The instant the page's clock reads `resetTime` on the calendar date
 * `year-month-date` (month 0-based; out-of-range dates roll over).
 *
 * Built from `tzOffset` only, never the system zone's `Date` setters, so the
 * result is the same on every machine:
 * - a wall time skipped by spring-forward (02:30 in New York) uses the
 *   pre-change offset and lands on the shifted instant (03:30 EDT);
 * - a wall time repeated by fall-back (01:30) resolves to its first
 *   occurrence, the moment the clock first reads it.
 * Either way each day has exactly one boundary.
 */
function resetInstantOn(
  year: number,
  month: number,
  date: number,
  resetTime: ResetTime,
  timeZone: string,
): Date {
  const { hours, minutes } = parseResetTime(resetTime)
  // The wall time's fields, read as if they were UTC.
  const wall = Date.UTC(year, month, date, hours, minutes)
  // DST changes are months apart, so ±1 day brackets at most one of them.
  const offsetBefore = tzOffset(timeZone, new Date(wall - DAY_MS))
  const offsetAfter = tzOffset(timeZone, new Date(wall + DAY_MS))
  const atOffset = (offset: number) => wall - offset * MINUTE_MS
  const valid = (offset: number) => tzOffset(timeZone, new Date(atOffset(offset))) === offset

  const candidates = [offsetBefore, offsetAfter].filter(valid).map(atOffset)
  // No valid candidate means the wall time is in a spring-forward gap.
  return new Date(candidates.length > 0 ? Math.min(...candidates) : atOffset(offsetBefore))
}

/** The reset boundary on the page-local calendar day `dayOffset` days from `now`'s. */
function boundaryOnDay(now: Date, dayOffset: number, resetTime: ResetTime, timeZone: string): Date {
  const local = new TZDate(now, timeZone)
  return resetInstantOn(
    local.getFullYear(),
    local.getMonth(),
    local.getDate() + dayOffset,
    resetTime,
    timeZone,
  )
}

/** The most recent reset boundary at or before `now`. */
export function latestResetBoundary(now: Date, resetTime: ResetTime, timeZone: string): Date {
  const todays = boundaryOnDay(now, 0, resetTime, timeZone)
  return todays <= now ? todays : boundaryOnDay(now, -1, resetTime, timeZone)
}

/** The next reset boundary strictly after `now`. */
export function nextResetBoundary(now: Date, resetTime: ResetTime, timeZone: string): Date {
  const todays = boundaryOnDay(now, 0, resetTime, timeZone)
  return todays > now ? todays : boundaryOnDay(now, 1, resetTime, timeZone)
}

/**
 * Has the reset time passed since the page was last reset? True when a
 * boundary lies in (lastResetAt, now]. Several missed boundaries (a page left
 * closed for days) still mean one reset, not one per day.
 */
export function isResetDue(
  lastResetAt: string,
  now: Date,
  resetTime: ResetTime,
  timeZone: string,
): boolean {
  return new Date(lastResetAt) < latestResetBoundary(now, resetTime, timeZone)
}

/**
 * The reset boundary on the 1st of the page-local month containing `now`
 * (`monthOffset` months from it). Same wall-time rules as the daily boundary.
 */
function monthBoundary(now: Date, monthOffset: number, resetTime: ResetTime, timeZone: string): Date {
  const local = new TZDate(now, timeZone)
  return resetInstantOn(local.getFullYear(), local.getMonth() + monthOffset, 1, resetTime, timeZone)
}

/** The most recent month-start reset boundary (reset time on the 1st) at or before `now`. */
export function latestMonthResetBoundary(now: Date, resetTime: ResetTime, timeZone: string): Date {
  const thisMonths = monthBoundary(now, 0, resetTime, timeZone)
  return thisMonths <= now ? thisMonths : monthBoundary(now, -1, resetTime, timeZone)
}

/**
 * Has a new month started (at the reset time on the 1st) since the last reset?
 * A reset missed across the month change (page closed over the 1st) still
 * counts, so month goals catch up on the next reset.
 */
export function isMonthResetDue(
  lastResetAt: string,
  now: Date,
  resetTime: ResetTime,
  timeZone: string,
): boolean {
  return new Date(lastResetAt) < latestMonthResetBoundary(now, resetTime, timeZone)
}

/**
 * The automatic reset (LP-5.3): what Reset Day clears (Done tasks of the day
 * of `now`, day goals, themes), plus month goals when a new month started
 * since `page.lastResetAt`. Done → Unchecked only. Records `now` as
 * `lastResetAt`.
 */
/** The most recent reset boundary on a Sunday (weeks start on Sunday, as the calendar view does). */
export function latestWeekResetBoundary(now: Date, resetTime: ResetTime, timeZone: string): Date {
  const local = new TZDate(now, timeZone)
  const sunday = (back: number) =>
    resetInstantOn(local.getFullYear(), local.getMonth(), local.getDate() - local.getDay() - back, resetTime, timeZone)
  const thisWeeks = sunday(0)
  return thisWeeks <= now ? thisWeeks : sunday(7)
}

/** The most recent reset boundary on January 1st. */
export function latestYearResetBoundary(now: Date, resetTime: ResetTime, timeZone: string): Date {
  const local = new TZDate(now, timeZone)
  const thisYears = resetInstantOn(local.getFullYear(), 0, 1, resetTime, timeZone)
  return thisYears <= now ? thisYears : resetInstantOn(local.getFullYear() - 1, 0, 1, resetTime, timeZone)
}

/**
 * The automatic reset (LP-5.3, LP-4.2): what Reset Day clears, plus week
 * goals on the first reset of a week, month goals on the first reset of a
 * month, and year goals on the first reset of a year.
 */
export function applyDailyReset(page: PGPage, now: Date): PGPage {
  const dayReset = resetDay(page, now)
  const last = new Date(page.lastResetAt)
  const due = {
    week: last < latestWeekResetBoundary(now, page.resetTime, page.timeZone),
    month: isMonthResetDue(page.lastResetAt, now, page.resetTime, page.timeZone),
    year: last < latestYearResetBoundary(now, page.resetTime, page.timeZone),
  }
  const clears = (g: Goal) =>
    g.completed && ((g.scope === 'week' && due.week) || (g.scope === 'month' && due.month) || (g.scope === 'year' && due.year))
  const goals = dayReset.goals.some(clears)
    ? dayReset.goals.map((g: Goal) => (clears(g) ? { ...g, completed: false } : g))
    : dayReset.goals
  return { ...dayReset, goals, lastResetAt: now.toISOString() }
}

/** Runs the reset if a daily boundary has passed since the last one, else returns `page`. */
export function applyDailyResetIfDue(page: PGPage, now: Date): PGPage {
  return isResetDue(page.lastResetAt, now, page.resetTime, page.timeZone)
    ? applyDailyReset(page, now)
    : page
}

/**
 * Changes the reset time without firing retroactively: a boundary of the new
 * time that already passed today doesn't wipe the user's progress. The next
 * reset is the new time's next occurrence. A reset that was already due under
 * the old time runs first, so moving the time can't skip a day or a month.
 */
export function changeResetTime(page: PGPage, resetTime: ResetTime, now: Date): PGPage {
  if (resetTime === page.resetTime) return page
  const current = applyDailyResetIfDue(page, now)
  const passed = latestResetBoundary(now, resetTime, current.timeZone)
  const lastResetAt =
    new Date(current.lastResetAt) < passed ? passed.toISOString() : current.lastResetAt
  return { ...current, resetTime, lastResetAt }
}

/** "00:00" → "12:00 am", "13:05" → "1:05 pm". */
export function formatResetTime(resetTime: ResetTime): string {
  const parsed = parse(resetTime, 'HH:mm', new Date(2000, 0, 1))
  if (!isValid(parsed)) throw new Error(`Invalid reset time "${resetTime}"`)
  return format(parsed, 'h:mm aaa')
}
