import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'
import type { TimelineWindow } from './timeline'
import type { TimeSpan } from './types'

/** "October 10th 2026" in the page's time zone. */
export function formatDayLabel(day: Date, timeZone: string): string {
  return format(new TZDate(day, timeZone), 'MMMM do yyyy')
}

const RELATIVE_DAYS = ['yesterday', 'today', 'tomorrow'] as const

/** "9:00 AM yesterday" inside the window, "9:00 AM Oct 7" outside it. */
export function describeTime(time: Date, window: TimelineWindow): string {
  const zoned = new TZDate(time, window.timeZone)
  const clock = format(zoned, 'h:mm a')
  const bounds = [...window.days, window.end]
  const dayIndex = window.days.findIndex((day, i) => time >= day && time < bounds[i + 1])
  return dayIndex === -1 ? `${clock} ${format(zoned, 'MMM d')}` : `${clock} ${RELATIVE_DAYS[dayIndex]}`
}

/** Spoken range for a task or phase, e.g. "9:00 AM yesterday to 5:00 PM tomorrow". */
export function describeSpan(span: TimeSpan, window: TimelineWindow): string {
  return `${describeTime(new Date(span.start), window)} to ${describeTime(new Date(span.end), window)}`
}
