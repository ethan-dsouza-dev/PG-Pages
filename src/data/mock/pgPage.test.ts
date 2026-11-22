import { describe, expect, it } from 'vitest'
import {
  clampToWindow,
  getTimelineWindow,
  getUntimedTasksForDay,
  getVisibleHours,
  groupTasksIntoRows,
  isTimed,
} from '../../domain/timeline'
import { createMockPage } from './pgPage'

describe('createMockPage', () => {
  const now = new Date('2026-10-10T17:00:00Z')
  const page = createMockPage(now, 'UTC')

  it('has 5 day goals, 5 month goals, and 1 theme', () => {
    const count = (scope: string) => page.goals.filter((g) => g.scope === scope).length
    expect([count('day'), count('month'), count('theme')]).toEqual([5, 5, 1])
  })

  it('lays out the mockup rows in order', () => {
    // As the timeline does: scheduled, timed, and inside the three visible days.
    const window = getTimelineWindow(now, 'UTC')
    const rows = groupTasksIntoRows(
      page.tasks.filter((t) => !t.unscheduled && isTimed(t) && clampToWindow(t, window) !== null),
    )
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

  it('auto-extends the default 08:00–22:00 to 07:00 for Pre-reading', () => {
    expect(getVisibleHours(getTimelineWindow(now, 'UTC'), page.tasks, false)).toEqual({
      startHour: 7,
      endHour: 22,
    })
  })

  it("has All Day and untimed tasks today, including the boards' daily routines", () => {
    const today = getTimelineWindow(now, 'UTC').days[1]
    const titles = getUntimedTasksForDay(page.tasks.filter((t) => !t.unscheduled), today, 'UTC').map((t) => t.title)
    expect(titles.slice(0, 2)).toEqual(["Grandma's birthday", 'Pay rent'])
    // 2026-10-10 is a Saturday: "Clean your room" repeats daily on three boards; weekday items don't show.
    expect(titles.filter((t) => t === 'Clean your room')).toHaveLength(3)
    expect(titles).not.toContain('Meet Design Group')
  })

  it('files every task in exactly one folder (TW-OQ-1)', () => {
    const keys = new Set(page.tasks.map((t) => t.seriesId ?? t.id))
    const listed = page.boards.flatMap((b) => {
      const walk = (gs: typeof b.groups): string[] => gs.flatMap((g) => [...g.itemIds, ...walk(g.children ?? [])])
      return walk(b.groups)
    })
    expect(new Set(listed)).toEqual(keys)
    expect(listed).toHaveLength(keys.size)
  })

  it('only references goals that exist', () => {
    const goalIds = new Set(page.goals.map((g) => g.id))
    for (const task of page.tasks) {
      if (task.goalId) expect(goalIds).toContain(task.goalId)
    }
  })
})
