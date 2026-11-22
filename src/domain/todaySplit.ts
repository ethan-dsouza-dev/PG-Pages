import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'
import type { BoardItem, Weekday } from './types'

/*
 * LP-7.8 / LP-7.9: inside a folder, items on today's schedule come first
 * (inside the black outline); past, unused, and not-yet-started items follow.
 */

const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/

/** The calendar day ('YYYY-MM-DD') that `now` falls on in `timeZone`. */
export function calendarDate(now: Date, timeZone: string): string {
  return format(new TZDate(now, timeZone), 'yyyy-MM-dd')
}

/** Weekday of a calendar day, independent of the runtime's time zone. */
export function weekdayOf(date: string): Weekday {
  if (!CALENDAR_DATE.test(date)) throw new Error(`Not a calendar date: "${date}"`)
  return new Date(`${date}T00:00:00Z`).getUTCDay() as Weekday
}

/** True when the item has an instance on `today` or repeats on its weekday. */
export function isOnTodaysSchedule(item: BoardItem, today: string): boolean {
  const schedule = item.schedule
  if (!schedule) return false
  if (schedule.instances?.includes(today)) return true
  return schedule.repeatsOn?.includes(weekdayOf(today)) ?? false
}

export type TodaySplit<T> = {
  /** On today's schedule, in input order. */
  today: T[]
  /** Everything else, in input order. */
  rest: T[]
}

/** Stable partition of `items` into today's and the rest. */
export function splitByToday<T extends BoardItem>(items: readonly T[], today: string): TodaySplit<T> {
  const split: TodaySplit<T> = { today: [], rest: [] }
  for (const item of items) (isOnTodaysSchedule(item, today) ? split.today : split.rest).push(item)
  return split
}
