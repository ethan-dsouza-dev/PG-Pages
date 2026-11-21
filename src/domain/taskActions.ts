import type { PGPage, Task } from './types'

/*
 * Pure reducers for the task context menu. Like dayActions, untouched tasks
 * keep their object identity and a no-op returns the same page.
 */

/** Tasks that belong on the timeline: everything not taken off the schedule. */
export function scheduledTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => !t.unscheduled)
}

/**
 * On the upcoming schedule: still scheduled and not yet over. Only these can be
 * removed (LP-6.9); a finished task is history, not schedule.
 */
export function isOnUpcomingSchedule(task: Task, now: Date): boolean {
  return !task.unscheduled && new Date(task.end) > now
}

/**
 * LP-6.9 Remove: takes a task off the schedule without deleting it. Ignored
 * (same page returned) for unknown tasks or tasks not on the upcoming schedule.
 */
export function unscheduleTask(page: PGPage, taskId: string, now: Date): PGPage {
  const task = page.tasks.find((t) => t.id === taskId)
  if (!task || !isOnUpcomingSchedule(task, now)) return page
  return {
    ...page,
    tasks: page.tasks.map((t) => (t === task ? { ...t, unscheduled: true } : t)),
  }
}

/** LP-6.10 Delete: removes a task from the page data for good. */
export function deleteTask(page: PGPage, taskId: string): PGPage {
  if (!page.tasks.some((t) => t.id === taskId)) return page
  return { ...page, tasks: page.tasks.filter((t) => t.id !== taskId) }
}
