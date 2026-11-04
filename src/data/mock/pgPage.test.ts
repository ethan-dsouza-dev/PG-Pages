import { describe, expect, it } from 'vitest'
import { clampToWindow, getTimelineWindow, groupTasksIntoRows } from '../../domain/timeline'
import { createMockPage } from './pgPage'

describe('createMockPage', () => {
  const now = new Date('2026-10-10T17:00:00Z')
  const page = createMockPage(now, 'UTC')

  it('has 5 day goals, 5 month goals, and 1 theme', () => {
    const count = (scope: string) => page.goals.filter((g) => g.scope === scope).length
    expect([count('day'), count('month'), count('theme')]).toEqual([5, 5, 1])
  })

  it('lays out the mockup rows in order', () => {
    const rows = groupTasksIntoRows(page.tasks)
    expect(rows.map((r) => r[0].title)).toEqual([
      'Make the bed',
      'F101 Assignment',
      'Weekly FS Project',
      'F101 Assignment',
      'Pre-reading',
    ])
    expect(rows[0]).toHaveLength(3)
  })

  it('has long tasks running off both edges of the timeline', () => {
    const window = getTimelineWindow(now, 'UTC')
    const f101 = clampToWindow(page.tasks.find((t) => t.id === 'f101-assignment')!, window)
    expect(f101?.startsBefore && f101.endsAfter).toBe(true)
  })

  it('only references goals that exist', () => {
    const goalIds = new Set(page.goals.map((g) => g.id))
    for (const task of page.tasks) {
      if (task.goalId) expect(goalIds).toContain(task.goalId)
    }
  })
})
