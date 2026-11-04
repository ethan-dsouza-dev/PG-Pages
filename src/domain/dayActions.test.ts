import { describe, expect, it } from 'vitest'
import { checkAll, resetDay, toggleGoal, toggleTask } from './dayActions'
import type { Goal, PGPage, Task } from './types'

const TODAY = new Date('2026-10-10T17:00:00Z')

function goal(id: string, scope: Goal['scope'], completed = false): Goal {
  return { id, title: id, scope, completed }
}

function task(id: string, start: string, end: string, completed = false): Task {
  return { id, title: id, start, end, timeZone: 'UTC', completed }
}

function page(): PGPage {
  return {
    id: 'p',
    ownerName: 'Jake',
    title: "Jake's First PG Page",
    version: 1,
    timeZone: 'UTC',
    goals: [goal('day-1', 'day'), goal('day-2', 'day', true), goal('month-1', 'month'), goal('theme-1', 'theme')],
    tasks: [
      task('today', '2026-10-10T09:00:00Z', '2026-10-10T10:00:00Z'),
      task('spanning', '2026-10-08T00:00:00Z', '2026-10-12T00:00:00Z'),
      task('yesterday', '2026-10-09T09:00:00Z', '2026-10-09T10:00:00Z'),
      task('tomorrow', '2026-10-11T09:00:00Z', '2026-10-11T10:00:00Z', true),
    ],
  }
}

const completedIds = (items: Array<{ id: string; completed: boolean }>) =>
  items.filter((i) => i.completed).map((i) => i.id)

describe('toggleGoal / toggleTask', () => {
  it('flips only the targeted item and keeps the others by reference', () => {
    const before = page()
    const after = toggleGoal(before, 'day-1')
    expect(after.goals[0].completed).toBe(true)
    expect(after.goals[2]).toBe(before.goals[2])

    const again = toggleGoal(after, 'day-1')
    expect(again.goals[0].completed).toBe(false)
  })

  it('toggles tasks', () => {
    const after = toggleTask(page(), 'yesterday')
    expect(completedIds(after.tasks)).toEqual(['yesterday', 'tomorrow'])
  })
})

describe('checkAll', () => {
  it("completes day goals and today's tasks only", () => {
    const after = checkAll(page(), TODAY)
    expect(completedIds(after.goals)).toEqual(['day-1', 'day-2'])
    expect(completedIds(after.tasks)).toEqual(['today', 'spanning', 'tomorrow'])
  })

  it('leaves month goals and themes untouched (same references)', () => {
    const before = page()
    const after = checkAll(before, TODAY)
    expect(after.goals[2]).toBe(before.goals[2])
    expect(after.goals[3]).toBe(before.goals[3])
  })

  it('returns the same page when nothing changes', () => {
    const once = checkAll(page(), TODAY)
    expect(checkAll(once, TODAY)).toBe(once)
  })
})

describe('resetDay', () => {
  it("un-completes day goals and today's tasks only", () => {
    const after = resetDay(checkAll(page(), TODAY), TODAY)
    expect(completedIds(after.goals)).toEqual([])
    expect(completedIds(after.tasks)).toEqual(['tomorrow'])
  })

  it('does not touch completed month goals', () => {
    const withMonthDone = toggleGoal(page(), 'month-1')
    const after = resetDay(withMonthDone, TODAY)
    expect(completedIds(after.goals)).toEqual(['month-1'])
  })
})
