/**
 * UI-phase domain types for a PG (Personal Growth) Page.
 * Dates are ISO 8601 strings so fixtures and future persistence stay serializable.
 */

export type GoalScope = 'day' | 'month' | 'theme'

export type Goal = {
  id: string
  title: string
  scope: GoalScope
  completed: boolean
}

export type Phase = {
  id: string
  title: string
  start: string
  end: string
  subphases?: Phase[]
}

// TODO(OQ-7): reconcile with the PROJECT_BRIEF `Event` model (source, recurrence,
// sync fields) before adding persistence.
export type Task = {
  id: string
  title: string
  start: string
  end: string
  /** IANA time zone */
  timeZone: string
  completed: boolean
  /** Tasks relate to a Goal. */
  goalId?: string
  /** Instances of a repeating task share one timeline row. */
  seriesId?: string
  /** Rendered as the dark strip under the bar; absent means no strip. */
  phases?: Phase[]
}

export type PGPage = {
  id: string
  ownerName: string
  title: string
  version: number
  /** IANA time zone that defines the page's day boundaries. */
  timeZone: string
  goals: Goal[]
  tasks: Task[]
}

/** Anything with an ISO start and end, e.g. a Task or a Phase. */
export type TimeSpan = Pick<Task, 'start' | 'end'>

/** A sponsored placement shown in the ad gallery. */
export type Ad = {
  id: string
  /** Used in the accessible name ("Advertisement: {advertiser}"). */
  advertiser: string
  /** Intrinsic pixel size, so the frame reserves the right shape before load. */
  image: { src: string; alt: string; width: number; height: number }
  /** Advertiser tagline shown above the frame, e.g. "Join us at the museum". */
  caption?: string
  /** Click-through URL. */
  href: string
}
