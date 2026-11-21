import { describe, expect, it } from 'vitest'
import {
  applyDailyReset,
  applyDailyResetIfDue,
  changeResetTime,
  formatResetTime,
  isResetDue,
  isResetTime,
  latestResetBoundary,
  nextResetBoundary,
} from './dailyReset'
import type { Goal, PGPage, Task } from './types'

const iso = (d: Date) => d.toISOString()

describe('isResetDue', () => {
  const tz = 'UTC'

  it('is false before the reset time and true once it passes', () => {
    const last = '2026-10-10T09:00:00.000Z' // reset at 09:00 today
    expect(isResetDue(last, new Date('2026-10-10T23:59:00Z'), '09:00', tz)).toBe(false)
    expect(isResetDue(last, new Date('2026-10-11T08:59:59Z'), '09:00', tz)).toBe(false)
    expect(isResetDue(last, new Date('2026-10-11T09:00:00Z'), '09:00', tz)).toBe(true)
  })

  it('handles the default midnight reset across the day change', () => {
    const last = '2026-10-10T00:00:00.000Z'
    expect(isResetDue(last, new Date('2026-10-10T23:59:59Z'), '00:00', tz)).toBe(false)
    expect(isResetDue(last, new Date('2026-10-11T00:00:00Z'), '00:00', tz)).toBe(true)
  })

  it('does not double-reset after a reload past the reset time', () => {
    const now = new Date('2026-10-11T09:30:00Z')
    const resetAt = '2026-10-11T09:00:05.000Z' // the reset ran 5s after 09:00
    expect(isResetDue(resetAt, now, '09:00', tz)).toBe(false)
  })

  it('catches a boundary missed while the page was closed', () => {
    const last = '2026-10-08T09:00:00.000Z'
    expect(isResetDue(last, new Date('2026-10-11T08:00:00Z'), '09:00', tz)).toBe(true)
  })

  it('uses the page time zone, not UTC', () => {
    // 00:00 in New York (EDT, UTC-4) is 04:00Z.
    const last = '2026-10-10T04:00:00.000Z'
    expect(isResetDue(last, new Date('2026-10-11T03:59:00Z'), '00:00', 'America/New_York')).toBe(false)
    expect(isResetDue(last, new Date('2026-10-11T04:00:00Z'), '00:00', 'America/New_York')).toBe(true)
  })
})

describe('reset boundaries on DST days (America/New_York)', () => {
  const tz = 'America/New_York'

  it('spring forward: an 08:00 reset lands at 08:00 EDT on the 23h day', () => {
    // 2026-03-08: clocks go 02:00 EST → 03:00 EDT.
    const now = new Date('2026-03-08T13:00:00Z') // 09:00 EDT
    expect(iso(latestResetBoundary(now, '08:00', tz))).toBe('2026-03-08T12:00:00.000Z')
    expect(iso(latestResetBoundary(now, '00:00', tz))).toBe('2026-03-08T05:00:00.000Z')
    expect(iso(nextResetBoundary(now, '00:00', tz))).toBe('2026-03-09T04:00:00.000Z')
  })

  it('spring forward: a reset time inside the missing hour fires once, at the shifted instant', () => {
    const boundary = latestResetBoundary(new Date('2026-03-08T12:00:00Z'), '02:30', tz)
    // 02:30 doesn't exist; it resolves to 03:30 EDT (07:30Z), never skipped.
    expect(iso(boundary)).toBe('2026-03-08T07:30:00.000Z')
    expect(isResetDue('2026-03-07T07:30:00.000Z', new Date('2026-03-08T07:29:00Z'), '02:30', tz)).toBe(false)
    expect(isResetDue('2026-03-07T07:30:00.000Z', new Date('2026-03-08T07:30:00Z'), '02:30', tz)).toBe(true)
  })

  it('fall back: midnight and 08:00 resets each fire once on the 25h day', () => {
    // 2026-11-01: clocks go 02:00 EDT → 01:00 EST.
    expect(iso(latestResetBoundary(new Date('2026-11-01T12:00:00Z'), '00:00', tz))).toBe(
      '2026-11-01T04:00:00.000Z',
    )
    expect(iso(nextResetBoundary(new Date('2026-11-01T12:00:00Z'), '00:00', tz))).toBe(
      '2026-11-02T05:00:00.000Z',
    )
    const last = '2026-10-31T12:00:00.000Z' // 08:00 EDT
    expect(isResetDue(last, new Date('2026-11-01T12:59:00Z'), '08:00', tz)).toBe(false)
    expect(isResetDue(last, new Date('2026-11-01T13:00:00Z'), '08:00', tz)).toBe(true) // 08:00 EST
  })

  it('fall back: a repeated 01:30 resets only once, at its first (EDT) occurrence', () => {
    const last = '2026-10-31T05:30:00.000Z' // yesterday's 01:30 EDT
    expect(isResetDue(last, new Date('2026-11-01T05:29:00Z'), '01:30', tz)).toBe(false)
    // The first 01:30 (EDT, 05:30Z) triggers the reset…
    expect(iso(latestResetBoundary(new Date('2026-11-01T05:30:00Z'), '01:30', tz))).toBe(
      '2026-11-01T05:30:00.000Z',
    )
    expect(isResetDue(last, new Date('2026-11-01T05:30:00Z'), '01:30', tz)).toBe(true)
    // …and the second 01:30 (EST, 06:30Z) doesn't fire again.
    expect(isResetDue('2026-11-01T05:30:00.000Z', new Date('2026-11-01T06:45:00Z'), '01:30', tz)).toBe(false)
    expect(iso(nextResetBoundary(new Date('2026-11-01T06:45:00Z'), '01:30', tz))).toBe(
      '2026-11-02T06:30:00.000Z',
    )
  })

  it('does not depend on the machine time zone for page zones far from it', () => {
    // 00:00 in Kolkata (UTC+5:30) and in Auckland during its DST (UTC+13).
    expect(iso(latestResetBoundary(new Date('2026-10-10T12:00:00Z'), '00:00', 'Asia/Kolkata'))).toBe(
      '2026-10-09T18:30:00.000Z',
    )
    expect(iso(latestResetBoundary(new Date('2026-10-10T12:00:00Z'), '00:00', 'Pacific/Auckland'))).toBe(
      '2026-10-10T11:00:00.000Z',
    )
  })
})

function goal(id: string, scope: Goal['scope'], completed: boolean): Goal {
  return { id, title: id, scope, completed }
}

function task(id: string, start: string, end: string, completed: boolean): Task {
  return { id, title: id, start, end, timeZone: 'UTC', completed }
}

function page(overrides: Partial<PGPage> = {}): PGPage {
  return {
    id: 'p',
    ownerName: 'Jake',
    title: 'Page',
    version: 1,
    timeZone: 'UTC',
    resetTime: '00:00',
    lastResetAt: '2026-10-10T00:00:00.000Z',
    goals: [goal('day-1', 'day', true), goal('month-1', 'month', true), goal('theme-1', 'theme', true)],
    tasks: [
      task('today', '2026-10-11T09:00:00Z', '2026-10-11T10:00:00Z', true),
      task('yesterday', '2026-10-10T09:00:00Z', '2026-10-10T10:00:00Z', true),
    ],
    ...overrides,
  }
}

describe('applyDailyReset', () => {
  const now = new Date('2026-10-11T00:00:30Z')

  it("unchecks every goal and theme plus the day's tasks, and records the reset", () => {
    const after = applyDailyReset(page(), now)
    expect(after.goals.every((g) => !g.completed)).toBe(true)
    expect(after.tasks.map((t) => t.completed)).toEqual([false, true])
    expect(after.lastResetAt).toBe(iso(now))
  })
})

describe('applyDailyResetIfDue', () => {
  it('returns the same page when no boundary has passed', () => {
    const p = page()
    expect(applyDailyResetIfDue(p, new Date('2026-10-10T23:00:00Z'))).toBe(p)
  })

  it('resets once the boundary passes, then not again until the next one', () => {
    const once = applyDailyResetIfDue(page(), new Date('2026-10-11T00:01:00Z'))
    expect(once.goals.some((g) => g.completed)).toBe(false)
    const rechecked = { ...once, goals: once.goals.map((g) => ({ ...g, completed: true })) }
    expect(applyDailyResetIfDue(rechecked, new Date('2026-10-11T23:59:00Z'))).toBe(rechecked)
  })
})

describe('changeResetTime', () => {
  const now = new Date('2026-10-10T10:00:00Z')

  it('does not fire retroactively for a time that already passed today', () => {
    const changed = changeResetTime(page(), '09:00', now)
    expect(changed.resetTime).toBe('09:00')
    expect(isResetDue(changed.lastResetAt, now, '09:00', 'UTC')).toBe(false)
    expect(isResetDue(changed.lastResetAt, new Date('2026-10-11T09:00:00Z'), '09:00', 'UTC')).toBe(true)
  })

  it('fires at a later time today', () => {
    const changed = changeResetTime(page(), '22:00', now)
    expect(isResetDue(changed.lastResetAt, new Date('2026-10-10T22:00:00Z'), '22:00', 'UTC')).toBe(true)
  })

  it('returns the same page when the time is unchanged', () => {
    const p = page()
    expect(changeResetTime(p, '00:00', now)).toBe(p)
  })
})

describe('formatting and validation', () => {
  it('formats as a 12-hour clock', () => {
    expect(formatResetTime('00:00')).toBe('12:00 am')
    expect(formatResetTime('13:05')).toBe('1:05 pm')
  })

  it('validates HH:mm', () => {
    expect(isResetTime('23:59')).toBe(true)
    expect(isResetTime('24:00')).toBe(false)
    expect(isResetTime('9:00')).toBe(false)
    expect(isResetTime('')).toBe(false)
  })
})
