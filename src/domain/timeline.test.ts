import { describe, expect, it } from 'vitest'
import {
  clampToWindow,
  createTimeScale,
  getDayBounds,
  getTimelineWindow,
  groupTasksIntoRows,
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

describe('createTimeScale', () => {
  it('gives each day the same width', () => {
    const w = getTimelineWindow(UTC_NOW, 'UTC')
    const x = createTimeScale(w, 400)
    expect(x(w.start)).toBe(0)
    expect(x(w.days[1])).toBe(400)
    expect(x(w.days[2])).toBe(800)
    expect(x(w.end)).toBe(1200)
    expect(x(new Date('2026-10-10T12:00:00Z'))).toBe(600)
  })

  it('keeps day boundaries aligned on a DST day', () => {
    const w = getTimelineWindow(new Date('2026-03-08T16:00:00Z'), 'America/New_York')
    const x = createTimeScale(w, 230)
    expect(x(w.days[2])).toBe(460)
    // Local noon is 11 real hours into the 23-hour day.
    expect(x(new Date('2026-03-08T16:00:00Z'))).toBeCloseTo(230 + (230 * 11) / 23)
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
