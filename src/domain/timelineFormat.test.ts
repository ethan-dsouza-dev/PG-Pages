import { describe, expect, it } from 'vitest'
import { getTimelineWindow } from './timeline'
import { describeSpan, describeTime, formatDayLabel } from './timelineFormat'

const window = getTimelineWindow(new Date('2026-10-10T17:00:00Z'), 'UTC')

describe('formatDayLabel', () => {
  it('formats with an ordinal day', () => {
    expect(formatDayLabel(window.days[1], 'UTC')).toBe('October 10th 2026')
  })

  it('uses the page time zone', () => {
    expect(formatDayLabel(new Date('2026-10-10T02:00:00Z'), 'America/New_York')).toBe(
      'October 9th 2026',
    )
  })
})

describe('describeTime / describeSpan', () => {
  it('uses relative day names inside the window', () => {
    expect(describeTime(new Date('2026-10-09T09:00:00Z'), window)).toBe('9:00 AM yesterday')
    expect(describeTime(new Date('2026-10-11T17:30:00Z'), window)).toBe('5:30 PM tomorrow')
  })

  it('falls back to a short date outside the window', () => {
    expect(describeTime(new Date('2026-10-07T09:00:00Z'), window)).toBe('9:00 AM Oct 7')
  })

  it('describes a span', () => {
    expect(
      describeSpan({ start: '2026-10-10T09:00:00Z', end: '2026-10-10T14:00:00Z' }, window),
    ).toBe('9:00 AM today to 2:00 PM today')
  })
})
