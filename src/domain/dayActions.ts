import { getDayBounds, overlaps } from './timeline'
import type { Goal, GoalScope, PGPage, Task } from './types'

/*
 * Pure reducers over a PGPage. Unchanged goals and tasks keep their object
 * identity, so store selectors only re-render the slices that actually changed.
 */

export function toggleGoal(page: PGPage, goalId: string): PGPage {
  return {
    ...page,
    goals: page.goals.map((g) => (g.id === goalId ? { ...g, completed: !g.completed } : g)),
  }
}

export function toggleTask(page: PGPage, taskId: string): PGPage {
  return {
    ...page,
    tasks: page.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
  }
}

/** Marks every day goal and every task overlapping `day` as completed. */
export function checkAll(page: PGPage, day: Date): PGPage {
  return setDayCompletion(page, day, true)
}

/**
 * Un-completes every day goal, every theme and every task overlapping `day`
 * (LP-5.1). Month goals reset monthly, so they're untouched.
 */
export function resetDay(page: PGPage, day: Date): PGPage {
  return setDayCompletion(page, day, false, ['day', 'theme'])
}

// Check All only covers day goals; month goals are never touched by day actions.
// Tasks taken off the schedule are skipped too (they are not on the timeline).
function setDayCompletion(
  page: PGPage,
  day: Date,
  completed: boolean,
  scopes: GoalScope[] = ['day'],
): PGPage {
  const bounds = getDayBounds(day, page.timeZone)
  const goals = mapIfChanged(page.goals, (g: Goal) =>
    scopes.includes(g.scope) && g.completed !== completed ? { ...g, completed } : g,
  )
  const tasks = mapIfChanged(page.tasks, (t: Task) =>
    !t.unscheduled && overlaps(t, bounds) && t.completed !== completed ? { ...t, completed } : t,
  )
  if (goals === page.goals && tasks === page.tasks) return page
  return { ...page, goals, tasks }
}

/** Like Array#map, but returns the original array when no item changed. */
function mapIfChanged<T>(items: T[], fn: (item: T) => T): T[] {
  let changed = false
  const next = items.map((item) => {
    const mapped = fn(item)
    if (mapped !== item) changed = true
    return mapped
  })
  return changed ? next : items
}
