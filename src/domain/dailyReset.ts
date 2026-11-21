import { TZDate } from '@date-fns/tz'
import { addDays, format, isValid, parse, set, startOfDay } from 'date-fns'
import { resetDay } from './dayActions'
import type { Goal, PGPage } from './types'

/*
 * LP-5.2 / LP-5.3: every PG Page has a local reset time (default 12:00 am).
 * Each time the page's wall clock passes it, daily tasks, goals and themes go
 * back to unchecked. All time math runs in the page's IANA time zone.
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

/**
 * The instant the page's clock reads `resetTime` on the calendar day of `day`.
 * On a DST day where that wall time doesn't exist (e.g. 02:30 during the
 * spring-forward gap) this lands on the shifted instant (02:30 → 03:30 EDT);
 * a repeated wall time (fall-back day) resolves to its second, standard-time
 * occurrence. Either way it fires once.
 */
function resetInstantOn(day: TZDate, resetTime: ResetTime): Date {
  const { hours, minutes } = parseResetTime(resetTime)
  // Set wall-clock fields (not elapsed time) so 23h/25h days still land on the
  // right local time. `set` keeps the TZDate's zone.
  const local = set(startOfDay(day), { hours, minutes })
  return new Date(local.getTime())
}

/** The most recent reset boundary at or before `now`. */
export function latestResetBoundary(now: Date, resetTime: ResetTime, timeZone: string): Date {
  const today = new TZDate(now, timeZone)
  const todays = resetInstantOn(today, resetTime)
  return todays <= now ? todays : resetInstantOn(addDays(today, -1), resetTime)
}

/** The next reset boundary strictly after `now`. */
export function nextResetBoundary(now: Date, resetTime: ResetTime, timeZone: string): Date {
  const today = new TZDate(now, timeZone)
  const todays = resetInstantOn(today, resetTime)
  return todays > now ? todays : resetInstantOn(addDays(today, 1), resetTime)
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
 * The automatic daily reset: what Reset Day clears for the day of `now`, plus
 * every goal and theme (all are checkable daily). Manual Reset Day is
 * unchanged. Records `now` as `lastResetAt`.
 */
export function applyDailyReset(page: PGPage, now: Date): PGPage {
  const dayReset = resetDay(page, now)
  const anyGoalDone = dayReset.goals.some((g) => g.completed)
  const goals = anyGoalDone
    ? dayReset.goals.map((g: Goal) => (g.completed ? { ...g, completed: false } : g))
    : dayReset.goals
  return { ...dayReset, goals, lastResetAt: now.toISOString() }
}

/** Runs the daily reset if a boundary has passed since the last one, else returns `page`. */
export function applyDailyResetIfDue(page: PGPage, now: Date): PGPage {
  return isResetDue(page.lastResetAt, now, page.resetTime, page.timeZone)
    ? applyDailyReset(page, now)
    : page
}

/**
 * Changes the reset time without firing retroactively: a boundary of the new
 * time that already passed today doesn't wipe the user's progress. The next
 * reset is the new time's next occurrence.
 */
export function changeResetTime(page: PGPage, resetTime: ResetTime, now: Date): PGPage {
  if (resetTime === page.resetTime) return page
  const passed = latestResetBoundary(now, resetTime, page.timeZone)
  const lastResetAt =
    new Date(page.lastResetAt) < passed ? passed.toISOString() : page.lastResetAt
  return { ...page, resetTime, lastResetAt }
}

/** "00:00" → "12:00 am", "13:05" → "1:05 pm". */
export function formatResetTime(resetTime: ResetTime): string {
  const parsed = parse(resetTime, 'HH:mm', new Date(2000, 0, 1))
  if (!isValid(parsed)) throw new Error(`Invalid reset time "${resetTime}"`)
  return format(parsed, 'h:mm aaa')
}
