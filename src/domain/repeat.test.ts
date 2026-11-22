import { describe, expect, it } from 'vitest'
import { describeRule, horizonFor, occurrences, presetRule } from './repeat'
import type { RepeatRule } from './types'

const first = { start: '2026-11-02T09:00:00Z', end: '2026-11-02T10:00:00Z' } // a Monday
const far = new Date('2027-12-31T00:00:00Z')
const starts = (rule: RepeatRule, f = first, horizon = far, tz = 'UTC') => occurrences(f, rule, tz, horizon).map((o) => o.start.slice(0, 10))

describe('occurrences', () => {
  it('daily, ending after a count', () => {
    expect(starts({ ...presetRule('daily'), ends: { type: 'after', count: 3 } })).toEqual(['2026-11-02', '2026-11-03', '2026-11-04'])
  })

  it('weekly keeps the weekday and the duration', () => {
    const list = occurrences(first, { ...presetRule('weekly'), ends: { type: 'after', count: 2 } }, 'UTC', far)
    expect(list).toEqual([
      { start: '2026-11-02T09:00:00.000Z', end: '2026-11-02T10:00:00.000Z' },
      { start: '2026-11-09T09:00:00.000Z', end: '2026-11-09T10:00:00.000Z' },
    ])
  })

  it('custom: every 2 weeks on Mon and Wed, until a date (inclusive)', () => {
    const rule: RepeatRule = { preset: 'custom', every: 2, unit: 'week', weekdays: [1, 3], ends: { type: 'on', date: '2026-11-18' } }
    expect(starts(rule)).toEqual(['2026-11-02', '2026-11-04', '2026-11-16', '2026-11-18'])
  })

  it('custom weekdays before the first day start the following week', () => {
    const rule: RepeatRule = { preset: 'custom', every: 1, unit: 'week', weekdays: [0, 2], ends: { type: 'after', count: 3 } }
    // Monday start: Sunday is behind it, Tuesday ahead.
    expect(starts(rule)).toEqual(['2026-11-03', '2026-11-08', '2026-11-10'])
  })

  it('every 3 days', () => {
    const rule: RepeatRule = { preset: 'custom', every: 3, unit: 'day', ends: { type: 'after', count: 3 } }
    expect(starts(rule)).toEqual(['2026-11-02', '2026-11-05', '2026-11-08'])
  })

  it('monthly skips months too short for the day', () => {
    const jan31 = { start: '2027-01-31T09:00:00Z', end: '2027-01-31T10:00:00Z' }
    expect(starts({ ...presetRule('monthly'), ends: { type: 'after', count: 3 } }, jan31)).toEqual([
      '2027-01-31',
      '2027-03-31',
      '2027-05-31',
    ])
  })

  it('stops open-ended rules at the horizon', () => {
    expect(starts(presetRule('daily'), first, new Date('2026-11-05T00:00:00Z'))).toEqual(['2026-11-02', '2026-11-03', '2026-11-04'])
  })

  it('keeps the wall-clock time across a DST change', () => {
    const ny = { start: '2026-10-30T13:00:00Z', end: '2026-10-30T14:00:00Z' } // 09:00 EDT, Friday
    const list = occurrences(ny, { ...presetRule('weekly'), ends: { type: 'after', count: 2 } }, 'America/New_York', far)
    expect(list[1].start).toBe('2026-11-06T14:00:00.000Z') // 09:00 EST
  })
})

describe('describeRule', () => {
  it('reads like the form', () => {
    expect(describeRule(presetRule('daily'))).toBe('Daily')
    expect(
      describeRule({ preset: 'custom', every: 2, unit: 'week', weekdays: [3, 1], ends: { type: 'on', date: '2026-12-31' } }),
    ).toBe('Every 2 weeks on Mon, Wed, until 2026-12-31')
    expect(describeRule({ ...presetRule('monthly'), ends: { type: 'after', count: 4 } })).toBe('Monthly, 4 times')
  })
})

describe('horizonFor', () => {
  it('runs 90 days past the later of now and the start', () => {
    expect(horizonFor(first, new Date('2026-12-01T00:00:00Z')).toISOString()).toBe('2027-03-01T00:00:00.000Z')
  })
})
