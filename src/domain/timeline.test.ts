import { describe, expect, it } from 'vitest'
import {
  clampToWindow,
  createTimeScale,
  DEFAULT_HOURS,
  FULL_DAY_HOURS,
  getDayBounds,
  getDayHours,
  getTimelineWindow,
  getUntimedTasksForDay,
  getVisibleHours,
  groupTasksIntoRows,
  hourOnDay,
  isTimeVisible,
  overlaps,
} from './timeline'
import type { Task } from './types'

const UTC_NOW = new Date('2026-10-10T17:00:00Z')

function task(overrides: Partial<Task> & Pick<Task, 'id'>): Task {
  return {
    title: overrides.id,
    start: '2026-10-10T09:00:00Z',
    end: '2026-10-10T10:00:00Z',
    timeZone: 'UTC',
    completed: false,
    ...overrides,
  }
}

describe('getTimelineWindow', () => {
  it('spans yesterday 00:00 to tomorrow 24:00', () => {
    const w = getTimelineWindow(UTC_NOW, 'UTC')
    expect(w.start.toISOString()).toBe('2026-10-09T00:00:00.000Z')
    expect(w.end.toISOString()).toBe('2026-10-12T00:00:00.000Z')
    expect(w.days.map((d) => d.toISOString())).toEqual([
      '2026-10-09T00:00:00.000Z',
      '2026-10-10T00:00:00.000Z',
      '2026-10-11T00:00:00.000Z',
    ])
  })

  it('uses the page time zone for day boundaries', () => {
    // 02:00 UTC on Oct 10 is still Oct 9 in New York.
    const w = getTimelineWindow(new Date('2026-10-10T02:00:00Z'), 'America/New_York')
    expect(w.days[1].toISOString()).toBe('2026-10-09T04:00:00.000Z')
  })

  it('handles a DST transition day (23h) in the page time zone', () => {
    // US DST starts 2026-03-08 at 02:00 local.
    const w = getTimelineWindow(new Date('2026-03-08T16:00:00Z'), 'America/New_York')
    const [, today, tomorrow] = w.days
    expect(today.toISOString()).toBe('2026-03-08T05:00:00.000Z')
    expect(tomorrow.toISOString()).toBe('2026-03-09T04:00:00.000Z')
    expect(tomorrow.getTime() - today.getTime()).toBe(23 * 3600_000)
  })
})

describe('hourOnDay', () => {
  it('returns wall-clock hours in the page zone, with 24 as the next midnight', () => {
    const day = new Date('2026-10-10T17:00:00Z')
    expect(hourOnDay(day, 8, 'UTC').toISOString()).toBe('2026-10-10T08:00:00.000Z')
    expect(hourOnDay(day, 24, 'UTC').toISOString()).toBe('2026-10-11T00:00:00.000Z')
    expect(hourOnDay(day, 8, 'America/New_York').toISOString()).toBe('2026-10-10T12:00:00.000Z')
  })

  it('keeps wall-clock hours on DST days', () => {
    // 2026-03-08: 02:00 → 03:00 in New York (EST -5 before, EDT -4 after).
    const day = new Date('2026-03-08T16:00:00Z')
    expect(hourOnDay(day, 0, 'America/New_York').toISOString()).toBe('2026-03-08T05:00:00.000Z')
    expect(hourOnDay(day, 8, 'America/New_York').toISOString()).toBe('2026-03-08T12:00:00.000Z')
    expect(hourOnDay(day, 22, 'America/New_York').toISOString()).toBe('2026-03-09T02:00:00.000Z')
    expect(hourOnDay(day, 24, 'America/New_York').toISOString()).toBe('2026-03-09T04:00:00.000Z')
  })
})

describe('getDayHours', () => {
  const day = UTC_NOW

  it('defaults to 08:00–22:00', () => {
    expect(getDayHours(day, [task({ id: 'a' })], 'UTC')).toEqual(DEFAULT_HOURS)
    expect(getDayHours(day, [], 'UTC')).toEqual({ startHour: 8, endHour: 22 })
  })

  it('extends earlier for a task starting before 08:00, rounded down to the hour', () => {
    const t = task({ id: 'early', start: '2026-10-10T06:30:00Z', end: '2026-10-10T09:00:00Z' })
    expect(getDayHours(day, [t], 'UTC')).toEqual({ startHour: 6, endHour: 22 })
  })

  it('extends later for a task ending after 22:00, rounded up to the hour', () => {
    const t = task({ id: 'late', start: '2026-10-10T20:00:00Z', end: '2026-10-10T22:15:00Z' })
    expect(getDayHours(day, [t], 'UTC')).toEqual({ startHour: 8, endHour: 23 })
  })

  it('treats ending at the next midnight as 24:00', () => {
    const t = task({ id: 'midnight', start: '2026-10-10T21:00:00Z', end: '2026-10-11T00:00:00Z' })
    expect(getDayHours(day, [t], 'UTC')).toEqual({ startHour: 8, endHour: 24 })
    // ...and it does not touch the next day.
    expect(getDayHours(new Date('2026-10-11T12:00:00Z'), [t], 'UTC')).toEqual(DEFAULT_HOURS)
  })

  it('keeps the hour after a late start and before an early end visible', () => {
    const overnight = task({ id: 'sleep', start: '2026-10-10T22:00:00Z', end: '2026-10-11T07:00:00Z' })
    expect(getDayHours(day, [overnight], 'UTC')).toEqual({ startHour: 8, endHour: 23 })
    expect(getDayHours(new Date('2026-10-11T12:00:00Z'), [overnight], 'UTC')).toEqual({
      startHour: 6,
      endHour: 22,
    })
  })

  it('ignores tasks that only pass through the day, and untimed tasks', () => {
    const multiDay = task({ id: 'long', start: '2026-10-08T01:00:00Z', end: '2026-10-12T23:00:00Z' })
    const allDay = task({
      id: 'holiday',
      timing: 'all-day',
      start: '2026-10-10T00:00:00Z',
      end: '2026-10-11T00:00:00Z',
    })
    expect(getDayHours(day, [multiDay, allDay], 'UTC')).toEqual(DEFAULT_HOURS)
  })

  it('uses the page zone wall clock', () => {
    // 11:00 UTC is 07:00 in New York.
    const t = task({ id: 'ny', start: '2026-10-10T11:00:00Z', end: '2026-10-10T14:00:00Z' })
    expect(getDayHours(day, [t], 'America/New_York')).toEqual({ startHour: 7, endHour: 22 })
  })
})

describe('getVisibleHours', () => {
  const w = getTimelineWindow(UTC_NOW, 'UTC')

  it('shares one range across the three days: the union of their needs', () => {
    const earlyYesterday = task({ id: 'y', start: '2026-10-09T05:00:00Z', end: '2026-10-09T09:00:00Z' })
    const lateTomorrow = task({ id: 't', start: '2026-10-11T21:00:00Z', end: '2026-10-11T23:30:00Z' })
    expect(getVisibleHours(w, [earlyYesterday, lateTomorrow], false)).toEqual({
      startHour: 5,
      endHour: 24,
    })
  })

  it('ignores tasks outside the window', () => {
    const lastWeek = task({ id: 'old', start: '2026-10-01T02:00:00Z', end: '2026-10-01T03:00:00Z' })
    expect(getVisibleHours(w, [lastWeek], false)).toEqual(DEFAULT_HOURS)
  })

  it('shows 24 hours when forced, overriding the default and auto-extend', () => {
    expect(getVisibleHours(w, [], true)).toEqual(FULL_DAY_HOURS)
  })
})

describe('createTimeScale', () => {
  it('gives each full day the same width', () => {
    const w = getTimelineWindow(UTC_NOW, 'UTC')
    const x = createTimeScale(w, FULL_DAY_HOURS, 400)
    expect(x(w.start)).toBe(0)
    expect(x(w.days[1])).toBe(400)
    expect(x(w.days[2])).toBe(800)
    expect(x(w.end)).toBe(1200)
    expect(x(new Date('2026-10-10T12:00:00Z'))).toBe(600)
  })

  it('maps 08:00–22:00 onto each day by default', () => {
    const w = getTimelineWindow(UTC_NOW, 'UTC')
    const x = createTimeScale(w, DEFAULT_HOURS, 140)
    expect(x(new Date('2026-10-09T08:00:00Z'))).toBe(0)
    expect(x(new Date('2026-10-09T15:00:00Z'))).toBe(70)
    expect(x(new Date('2026-10-10T08:00:00Z'))).toBe(140)
    expect(x(new Date('2026-10-10T09:00:00Z'))).toBe(150)
    expect(x(new Date('2026-10-11T22:00:00Z'))).toBe(420)
  })

  it('collapses hidden hours onto the day edge and clamps outside the window', () => {
    const w = getTimelineWindow(UTC_NOW, 'UTC')
    const x = createTimeScale(w, DEFAULT_HOURS, 140)
    // 23:00 yesterday and 03:00 today both fall in the hidden night between days.
    expect(x(new Date('2026-10-09T23:00:00Z'))).toBe(140)
    expect(x(new Date('2026-10-10T03:00:00Z'))).toBe(140)
    expect(x(new Date('2026-10-01T00:00:00Z'))).toBe(0)
    expect(x(new Date('2026-10-20T00:00:00Z'))).toBe(420)
  })

  it('maps an auto-extended range', () => {
    const w = getTimelineWindow(UTC_NOW, 'UTC')
    const x = createTimeScale(w, { startHour: 6, endHour: 24 }, 180)
    expect(x(new Date('2026-10-10T06:00:00Z'))).toBe(180)
    expect(x(new Date('2026-10-10T15:00:00Z'))).toBe(270)
    expect(x(new Date('2026-10-11T00:00:00Z'))).toBe(360)
  })

  it('keeps day boundaries aligned on a DST day (24 hours)', () => {
    const w = getTimelineWindow(new Date('2026-03-08T16:00:00Z'), 'America/New_York')
    const x = createTimeScale(w, FULL_DAY_HOURS, 230)
    expect(x(w.days[2])).toBe(460)
    // Local noon is 11 real hours into the 23-hour day.
    expect(x(new Date('2026-03-08T16:00:00Z'))).toBeCloseTo(230 + (230 * 11) / 23)
  })

  it('maps wall-clock 08:00–22:00 on a DST day', () => {
    const w = getTimelineWindow(new Date('2026-03-08T16:00:00Z'), 'America/New_York')
    const x = createTimeScale(w, DEFAULT_HOURS, 140)
    // 08:00 EDT = 12:00Z, 15:00 EDT = 19:00Z: halfway through the visible day.
    expect(x(new Date('2026-03-08T12:00:00Z'))).toBe(140)
    expect(x(new Date('2026-03-08T19:00:00Z'))).toBe(210)
    expect(x(new Date('2026-03-09T02:00:00Z'))).toBe(280)
  })
})

describe('isTimeVisible', () => {
  const w = getTimelineWindow(UTC_NOW, 'UTC')

  it('is false in hidden hours and outside the window', () => {
    expect(isTimeVisible(new Date('2026-10-10T12:00:00Z'), w, DEFAULT_HOURS)).toBe(true)
    expect(isTimeVisible(new Date('2026-10-10T23:00:00Z'), w, DEFAULT_HOURS)).toBe(false)
    expect(isTimeVisible(new Date('2026-10-10T07:59:00Z'), w, DEFAULT_HOURS)).toBe(false)
    expect(isTimeVisible(new Date('2026-10-10T23:00:00Z'), w, FULL_DAY_HOURS)).toBe(true)
    expect(isTimeVisible(new Date('2026-10-12T12:00:00Z'), w, FULL_DAY_HOURS)).toBe(false)
  })
})

describe('getUntimedTasksForDay', () => {
  it('returns only All Day and untimed tasks on that day', () => {
    const tasks = [
      task({ id: 'timed' }),
      task({ id: 'bday', timing: 'all-day', start: '2026-10-10T00:00:00Z', end: '2026-10-11T00:00:00Z' }),
      task({ id: 'call', timing: 'untimed', start: '2026-10-10T00:00:00Z', end: '2026-10-11T00:00:00Z' }),
      task({ id: 'next', timing: 'untimed', start: '2026-10-11T00:00:00Z', end: '2026-10-12T00:00:00Z' }),
    ]
    expect(getUntimedTasksForDay(tasks, UTC_NOW, 'UTC').map((t) => t.id)).toEqual(['bday', 'call'])
  })
})

describe('clampToWindow', () => {
  const w = getTimelineWindow(UTC_NOW, 'UTC')

  it('returns a span fully inside the window unchanged', () => {
    const c = clampToWindow(task({ id: 'a' }), w)
    expect(c).toEqual({
      start: new Date('2026-10-10T09:00:00Z'),
      end: new Date('2026-10-10T10:00:00Z'),
      startsBefore: false,
      endsAfter: false,
    })
  })

  it('clips a span that runs off both edges', () => {
    const c = clampToWindow(
      task({ id: 'b', start: '2026-10-01T00:00:00Z', end: '2026-10-20T00:00:00Z' }),
      w,
    )
    expect(c?.start).toEqual(w.start)
    expect(c?.end).toEqual(w.end)
    expect(c?.startsBefore).toBe(true)
    expect(c?.endsAfter).toBe(true)
  })

  it('returns null for spans entirely outside the window', () => {
    expect(
      clampToWindow(task({ id: 'c', start: '2026-10-01T00:00:00Z', end: '2026-10-02T00:00:00Z' }), w),
    ).toBeNull()
    // Touching the edge is not overlapping.
    expect(
      clampToWindow(task({ id: 'd', start: '2026-10-12T00:00:00Z', end: '2026-10-12T05:00:00Z' }), w),
    ).toBeNull()
  })
})

describe('groupTasksIntoRows', () => {
  it('puts a series in one row and keeps first-appearance order', () => {
    const rows = groupTasksIntoRows([
      task({ id: 'bed-1', seriesId: 'bed' }),
      task({ id: 'f101' }),
      task({ id: 'bed-2', seriesId: 'bed' }),
      task({ id: 'fs' }),
    ])
    expect(rows.map((r) => r.map((t) => t.id))).toEqual([['bed-1', 'bed-2'], ['f101'], ['fs']])
  })
})

describe('getDayBounds and overlaps', () => {
  it('detects overlap with a day', () => {
    const today = getDayBounds(UTC_NOW, 'UTC')
    expect(overlaps(task({ id: 'in' }), today)).toBe(true)
    expect(
      overlaps(task({ id: 'prev', start: '2026-10-09T20:00:00Z', end: '2026-10-10T00:00:00Z' }), today),
    ).toBe(false)
    expect(
      overlaps(task({ id: 'span', start: '2026-10-09T20:00:00Z', end: '2026-10-10T00:30:00Z' }), today),
    ).toBe(true)
  })
})
