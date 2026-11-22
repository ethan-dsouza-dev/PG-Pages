import { describe, expect, it } from 'vitest'
import { deleteTask, isOnUpcomingSchedule, scheduledTasks, unscheduleTask } from './taskActions'
import type { PGPage, Task } from './types'

const now = new Date('2026-11-20T12:00:00Z')

const task = (id: string, end: string, extra: Partial<Task> = {}): Task => ({
  id,
  title: id,
  start: '2026-11-20T08:00:00Z',
  end,
  timeZone: 'UTC',
  completed: false,
  ...extra,
})

const upcoming = task('upcoming', '2026-11-20T18:00:00Z')
const past = task('past', '2026-11-20T10:00:00Z')
const removed = task('removed', '2026-11-21T10:00:00Z', { unscheduled: true })

const page: PGPage = {
  id: 'p',
  ownerName: 'Test',
  title: 'Test',
  version: 1,
  timeZone: 'UTC',
  goals: [],
  tasks: [upcoming, past, removed],
  resetTime: '00:00',
  lastResetAt: '2026-11-20T00:00:00.000Z',
}

describe('isOnUpcomingSchedule', () => {
  it('is true only for scheduled tasks that have not ended', () => {
    expect(isOnUpcomingSchedule(upcoming, now)).toBe(true)
    expect(isOnUpcomingSchedule(past, now)).toBe(false)
    expect(isOnUpcomingSchedule(removed, now)).toBe(false)
  })

  it('treats a task ending exactly now as over', () => {
    expect(isOnUpcomingSchedule(task('edge', now.toISOString()), now)).toBe(false)
  })
})

describe('scheduledTasks', () => {
  it('drops unscheduled tasks', () => {
    expect(scheduledTasks(page.tasks)).toEqual([upcoming, past])
  })
})

describe('unscheduleTask', () => {
  it('flags the task as unscheduled but keeps it in the page', () => {
    const next = unscheduleTask(page, 'upcoming', now)
    expect(next.tasks).toHaveLength(3)
    expect(next.tasks[0]).toEqual({ ...upcoming, unscheduled: true })
    expect(next.tasks[1]).toBe(past)
    expect(next.tasks[2]).toBe(removed)
    expect(page.tasks[0].unscheduled).toBeUndefined()
  })

  it('ignores tasks that are not on the upcoming schedule', () => {
    expect(unscheduleTask(page, 'past', now)).toBe(page)
    expect(unscheduleTask(page, 'removed', now)).toBe(page)
    expect(unscheduleTask(page, 'missing', now)).toBe(page)
  })
})

describe('deleteTask', () => {
  it('removes the task from the page and keeps the others by reference', () => {
    const next = deleteTask(page, 'past')
    expect(next.tasks).toEqual([upcoming, removed])
    expect(next.tasks[0]).toBe(upcoming)
  })

  it('deletes unscheduled tasks too', () => {
    expect(deleteTask(page, 'removed').tasks).toEqual([upcoming, past])
  })

  it('returns the same page for an unknown id', () => {
    expect(deleteTask(page, 'missing')).toBe(page)
  })
})
