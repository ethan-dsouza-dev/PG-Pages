import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'
import { toLocalDate } from '../../domain/localTime'
import type { Task } from '../../domain/types'

/** "Sun 22 Nov 2026, 09:00 – 10:00" style description of one occurrence. */
export function describeOccurrence(task: Task, timeZone: string): string {
  const s = new TZDate(task.start, timeZone)
  const e = new TZDate(task.end, timeZone)
  if (task.timing === 'untimed') return `${format(s, 'EEE d MMM yyyy')}, no time`
  if (task.timing === 'all-day') {
    const last = new TZDate(Date.parse(task.end) - 1, timeZone)
    const sameDay = toLocalDate(task.start, timeZone) === toLocalDate(last.toISOString(), timeZone)
    return sameDay ? `${format(s, 'EEE d MMM yyyy')}, all day` : `${format(s, 'EEE d MMM')} – ${format(last, 'EEE d MMM yyyy')}, all day`
  }
  const sameDay = toLocalDate(task.start, timeZone) === toLocalDate(task.end, timeZone)
  return sameDay
    ? `${format(s, 'EEE d MMM yyyy, HH:mm')} – ${format(e, 'HH:mm')}`
    : `${format(s, 'EEE d MMM yyyy, HH:mm')} – ${format(e, 'EEE d MMM yyyy, HH:mm')}`
}
