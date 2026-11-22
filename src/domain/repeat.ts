import { TZDate } from '@date-fns/tz'
import { addDays, addMonths } from 'date-fns'
import { toLocalDate } from './localTime'
import type { RepeatPreset, RepeatRule, TimeSpan, Weekday } from './types'

/*
 * TW-3.8 repeats. Occurrences are generated as concrete spans and stored as
 * Tasks of one series, so every occurrence keeps its own Done/Missed status.
 * Steps are calendar steps in the page's time zone, so a 9:00 task stays at
 * 9:00 across DST changes.
 */

/** Repeats without an end are generated this far past today. */
export const OPEN_ENDED_HORIZON_DAYS = 90
/** Hard stop, whatever the rule says. */
export const MAX_OCCURRENCES = 500

export function presetRule(preset: Exclude<RepeatPreset, 'custom'>): RepeatRule {
  const unit = preset === 'daily' ? 'day' : preset === 'weekly' ? 'week' : 'month'
  return { preset, every: 1, unit, ends: { type: 'never' } }
}

/** A plain-English summary, e.g. "Every 2 weeks on Mon, Wed, until 2026-12-31". */
export function describeRule(rule: RepeatRule): string {
  const unitName = rule.every === 1 ? rule.unit : `${rule.unit}s`
  const base =
    rule.preset === 'daily'
      ? 'Daily'
      : rule.preset === 'weekly'
        ? 'Weekly'
        : rule.preset === 'monthly'
          ? 'Monthly'
          : rule.every === 1
            ? `Every ${unitName}`
            : `Every ${rule.every} ${unitName}`
  const days =
    rule.unit === 'week' && rule.weekdays?.length
      ? ` on ${[...rule.weekdays].sort().map((d) => WEEKDAY_SHORT[d]).join(', ')}`
      : ''
  const end =
    rule.ends.type === 'on'
      ? `, until ${rule.ends.date}`
      : rule.ends.type === 'after'
        ? `, ${rule.ends.count} times`
        : ''
  return `${base}${days}${end}`
}

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/** Calendar steps from the first occurrence, in order: [days, months]. */
function* steps(rule: RepeatRule, firstWeekday: Weekday): Generator<[number, number]> {
  const every = Math.max(1, Math.floor(rule.every))
  if (rule.unit === 'month') {
    for (let k = 0; ; k++) yield [0, k * every]
  }
  if (rule.unit === 'day') {
    for (let k = 0; ; k++) yield [k * every, 0]
  }
  const days = rule.weekdays?.length ? [...new Set(rule.weekdays)].sort((a, b) => a - b) : [firstWeekday]
  for (let week = 0; ; week += every) {
    for (const d of days) {
      const offset = week * 7 + (d - firstWeekday)
      if (offset >= 0) yield [offset, 0]
    }
  }
}

/**
 * Every occurrence of `first` under `rule`, `first` itself included when it
 * matches. Open-ended rules stop at `horizon`.
 */
export function occurrences(
  first: TimeSpan,
  rule: RepeatRule,
  timeZone: string,
  horizon: Date,
): TimeSpan[] {
  const start = new TZDate(first.start, timeZone)
  const end = new TZDate(first.end, timeZone)
  const firstWeekday = start.getDay() as Weekday
  const result: TimeSpan[] = []
  const endDate = rule.ends.type === 'on' ? rule.ends.date : null
  const maxCount = rule.ends.type === 'after' ? Math.max(1, Math.floor(rule.ends.count)) : MAX_OCCURRENCES

  for (const [dayStep, monthStep] of steps(rule, firstWeekday)) {
    if (result.length >= Math.min(maxCount, MAX_OCCURRENCES)) break
    const s = monthStep ? addMonths(start, monthStep) : addDays(start, dayStep)
    // A month too short for the day (e.g. the 31st) is skipped, not clamped.
    if (monthStep && s.getDate() !== start.getDate()) continue
    if (endDate !== null && toLocalDate(iso(s), timeZone) > endDate) break
    if (rule.ends.type === 'never' && s.getTime() > horizon.getTime()) break
    const e = monthStep ? addMonths(end, monthStep) : addDays(end, dayStep)
    result.push({ start: iso(s), end: iso(e) })
  }
  return result
}

/** A UTC ISO string ('…Z'); TZDate#toISOString would keep the zone's offset. */
const iso = (d: Date) => new Date(d.getTime()).toISOString()

/** How far an open-ended series is generated: OPEN_ENDED_HORIZON_DAYS past the later of now and its start. */
export function horizonFor(first: TimeSpan, now: Date): Date {
  const from = Math.max(now.getTime(), Date.parse(first.start))
  return new Date(from + OPEN_ENDED_HORIZON_DAYS * 86_400_000)
}
