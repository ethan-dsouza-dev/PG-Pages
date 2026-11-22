import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'

/*
 * Conversions between ISO instants and the wall-clock strings that native
 * <input type="datetime-local" | "date"> use, read in the page's time zone.
 */

const LOCAL_DATETIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** 'YYYY-MM-DDTHH:mm' for `iso` in `timeZone`. */
export function toLocalDateTime(iso: string, timeZone: string): string {
  return format(new TZDate(iso, timeZone), "yyyy-MM-dd'T'HH:mm")
}

/** 'YYYY-MM-DD' for `iso` in `timeZone`. */
export function toLocalDate(iso: string, timeZone: string): string {
  return format(new TZDate(iso, timeZone), 'yyyy-MM-dd')
}

/** 'YYYY-MM' for `iso` in `timeZone`. */
export function toLocalMonth(iso: string, timeZone: string): string {
  return format(new TZDate(iso, timeZone), 'yyyy-MM')
}

export function isLocalDateTime(value: string): boolean {
  return LOCAL_DATETIME.test(value)
}

export function isLocalDate(value: string): boolean {
  return LOCAL_DATE.test(value)
}

/** The instant a 'YYYY-MM-DDTHH:mm' wall time names in `timeZone`. Null if malformed. */
export function fromLocalDateTime(value: string, timeZone: string): Date | null {
  const m = LOCAL_DATETIME.exec(value)
  if (!m) return null
  const [, y, mo, d, h, mi] = m.map(Number)
  return wallTime(y, mo - 1, d, h, mi, timeZone)
}

/** Midnight at the start of a 'YYYY-MM-DD' day in `timeZone`. Null if malformed. */
export function fromLocalDate(value: string, timeZone: string): Date | null {
  const m = LOCAL_DATE.exec(value)
  if (!m) return null
  const [, y, mo, d] = m.map(Number)
  return wallTime(y, mo - 1, d, 0, 0, timeZone)
}

/**
 * The instant of a wall time in `timeZone`. Some runtimes report no zone
 * (`Intl…timeZone` undefined); then the runtime's local time is used, as
 * TZDate does for its other constructors.
 */
function wallTime(y: number, month: number, d: number, h: number, mi: number, timeZone: string | undefined): Date {
  return timeZone ? new Date(new TZDate(y, month, d, h, mi, timeZone).getTime()) : new Date(y, month, d, h, mi)
}

/** The calendar day after a 'YYYY-MM-DD' day. */
export function nextLocalDate(value: string): string {
  const [y, m, d] = value.split('-').map(Number)
  const next = new Date(Date.UTC(y, m - 1, d + 1))
  return next.toISOString().slice(0, 10)
}

/** The calendar day before a 'YYYY-MM-DD' day. */
export function previousLocalDate(value: string): string {
  const [y, m, d] = value.split('-').map(Number)
  const prev = new Date(Date.UTC(y, m - 1, d - 1))
  return prev.toISOString().slice(0, 10)
}
