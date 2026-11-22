import { describe, expect, it } from 'vitest'
import { calendarDate, isOnTodaysSchedule, splitByToday, weekdayOf } from './todaySplit'
import type { BoardItem, BoardItemSchedule } from './types'

const item = (id: string, schedule?: BoardItemSchedule): BoardItem => ({
  id,
  title: id,
  status: 'todo',
  categoryIds: ['work'],
  schedule,
})

// 2026-11-18 is a Wednesday.
const WEDNESDAY = '2026-11-18'

describe('calendarDate', () => {
  it('uses the given time zone, not the runtime one', () => {
    const instant = new Date('2026-11-18T23:30:00Z')
    expect(calendarDate(instant, 'UTC')).toBe('2026-11-18')
    expect(calendarDate(instant, 'Asia/Tokyo')).toBe('2026-11-19')
    expect(calendarDate(instant, 'America/Los_Angeles')).toBe('2026-11-18')
  })
})

describe('weekdayOf', () => {
  it('returns 0 for Sunday through 6 for Saturday', () => {
    expect(weekdayOf('2026-11-15')).toBe(0)
    expect(weekdayOf(WEDNESDAY)).toBe(3)
    expect(weekdayOf('2026-11-21')).toBe(6)
  })

  it('rejects anything but YYYY-MM-DD', () => {
    expect(() => weekdayOf('2026-11-18T10:00:00Z')).toThrow(/calendar date/)
  })
})

describe('isOnTodaysSchedule', () => {
  it('is true for an instance today or a repeat on today’s weekday', () => {
    expect(isOnTodaysSchedule(item('a', { instances: ['2026-11-01', WEDNESDAY] }), WEDNESDAY)).toBe(true)
    expect(isOnTodaysSchedule(item('b', { repeatsOn: [1, 3, 5] }), WEDNESDAY)).toBe(true)
  })

  it('is false for unscheduled, past, upcoming, and other-weekday items', () => {
    expect(isOnTodaysSchedule(item('none'), WEDNESDAY)).toBe(false)
    expect(isOnTodaysSchedule(item('empty', {}), WEDNESDAY)).toBe(false)
    expect(isOnTodaysSchedule(item('past', { instances: ['2026-11-17'] }), WEDNESDAY)).toBe(false)
    expect(isOnTodaysSchedule(item('upcoming', { instances: ['2026-11-19'] }), WEDNESDAY)).toBe(false)
    expect(isOnTodaysSchedule(item('weekends', { repeatsOn: [0, 6] }), WEDNESDAY)).toBe(false)
  })
})

describe('splitByToday', () => {
  it('puts today’s items first and keeps input order on both sides', () => {
    const list = [
      item('past', { instances: ['2026-11-10'] }),
      item('daily', { repeatsOn: [0, 1, 2, 3, 4, 5, 6] }),
      item('unused'),
      item('today', { instances: [WEDNESDAY] }),
      item('upcoming', { instances: ['2026-12-01'] }),
    ]
    const split = splitByToday(list, WEDNESDAY)
    expect(split.today.map((i) => i.id)).toEqual(['daily', 'today'])
    expect(split.rest.map((i) => i.id)).toEqual(['past', 'unused', 'upcoming'])
  })

  it('handles empty input and all-or-nothing cases', () => {
    expect(splitByToday([], WEDNESDAY)).toEqual({ today: [], rest: [] })
    const daily = [item('x', { repeatsOn: [3] })]
    expect(splitByToday(daily, WEDNESDAY)).toEqual({ today: daily, rest: [] })
    expect(splitByToday(daily, '2026-11-19')).toEqual({ today: [], rest: daily })
  })
})
