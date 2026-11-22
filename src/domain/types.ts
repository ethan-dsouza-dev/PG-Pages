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
/**
 * How a task sits in time. Absent means timed: drawn on the timeline from `start` to `end`.
 * - `all-day`: occupies the whole day(s) (a birthday, a trip).
 * - `untimed`: belongs to a day but has no time of day yet.
 * Both are kept off the time sheet (LP-3.11a); `start`/`end` then hold the
 * midnight-to-midnight span of the day(s) the task belongs to.
 */
export type TaskTiming = 'all-day' | 'untimed'

export type Task = {
  id: string
  title: string
  start: string
  end: string
  timing?: TaskTiming
  /** IANA time zone */
  timeZone: string
  completed: boolean
  /** Tasks relate to a Goal. */
  goalId?: string
  /** Instances of a repeating task share one timeline row. */
  seriesId?: string
  /** Rendered as the dark strip under the bar; absent means no strip. */
  phases?: Phase[]
  /**
   * Taken off the schedule (LP-6.9 "Remove"): hidden from the timeline but
   * still part of the page. Absent means scheduled.
   */
  unscheduled?: boolean
}

export type PGPage = {
  id: string
  ownerName: string
  /**
   * The user's name for this page (LP-2.1), shown before "PG Page" in the
   * header and footer, e.g. "Jake's First".
   */
  name: string
  version: number
  /** IANA time zone that defines the page's day boundaries. */
  timeZone: string
  /** Local "HH:mm" at which tasks, day goals and themes reset daily, month goals on the 1st (LP-5.2). Default "00:00". */
  resetTime: string
  /** ISO instant of the last automatic daily reset (LP-5.3). */
  lastResetAt: string
  goals: Goal[]
  tasks: Task[]
}

/** Anything with an ISO start and end, e.g. a Task or a Phase. */
export type TimeSpan = Pick<Task, 'start' | 'end'>

/** Hours of the day the timeline shows, in the page's wall-clock time. 0 ≤ startHour < endHour ≤ 24. */
export type HourRange = { startHour: number; endHour: number }

/** A sponsored placement shown in the ad gallery. */
export type Ad = {
  id: string
  /** Used in the accessible name ("Advertisement: {advertiser}"). */
  advertiser: string
  /** Intrinsic pixel size, so the frame reserves the right shape before load. */
  image: { src: string; alt: string; width: number; height: number }
  /** Advertiser tagline shown above the frame, e.g. "Join us at the museum". */
  caption?: string
  /** A sentence or two about the advertiser, shown in the ad's popup (LP-8.1). */
  description: string
  /** The advertiser's website, linked from the ad's popup (LP-8.1). */
  advertiserUrl: string
}

/* ---------- Category boards (brief 09) ---------- */

export type CategoryId = string

/** Which token set (`[data-board-theme]` block in tokens.css) a board uses. Grows with new themes. */
export type BoardTheme = 'productivity' | 'self-care' | 'leisure'

export type Category = {
  id: CategoryId
  /** "Productivity", "Social" */
  name: string
  theme: BoardTheme
}

export type BoardItemStatus = 'todo' | 'done' | 'inactive'

// Separate from Goal and Task on purpose. TODO(OQ-7): reconcile later.
export type BoardItem = {
  id: string
  title: string
  status: BoardItemStatus
  /** Every category the item belongs to. Decides which lane it lands in. */
  categoryIds: CategoryId[]
  /** Optional phase strip. `span` is required when phases are present. */
  span?: TimeSpan
  phases?: Phase[]
  /** When the item lands on the day schedule. Absent means unscheduled (LP-7.9). */
  schedule?: BoardItemSchedule
}

/** 0 = Sunday … 6 = Saturday, as `Date#getDay`. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/**
 * Where a board item shows up in the day schedule (LP-7.8). Dates are calendar
 * days ('YYYY-MM-DD') in the page's time zone. TODO(OQ-7): fold into the
 * recurrence model once Task and Event are reconciled.
 */
export type BoardItemSchedule = {
  /** One-off instances, one calendar day each. */
  instances?: string[]
  /** Repeats on these weekdays. */
  repeatsOn?: Weekday[]
}

export type BoardGroupLayout = 'compact' | 'expanded'

export type BoardGroup = {
  id: string
  title: string
  /** Small line above the title. TODO(OQ-15): UI copy or designer annotation? */
  note?: string
  layout: BoardGroupLayout
  /** Display order; lane placement is derived by `placeItems`. */
  itemIds: string[]
  /** Nested groups. The UI is tuned for one level; the type allows more. */
  children?: BoardGroup[]
}

export type Board = {
  id: string
  /** Title and theme come from this category. */
  categoryId: CategoryId
  /** One overlap lane each, in this order. */
  overlapCategoryIds: CategoryId[]
  groups: BoardGroup[]
}
