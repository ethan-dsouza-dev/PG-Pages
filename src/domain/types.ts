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
