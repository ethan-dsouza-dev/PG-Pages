import { describe, expect, it } from 'vitest'
import {
  boardItemsFromTasks,
  defaultFolderId,
  emptyBoards,
  folderOfKey,
  folderOptions,
  placeKey,
  pruneBoards,
  representativeTask,
  taskDates,
} from './boardTasks'
import type { Board, PGPage, Task } from './types'

const task = (id: string, start: string, extra: Partial<Task> = {}): Task => ({
  id,
  title: id,
  categoryId: 'productivity',
  start,
  end: new Date(Date.parse(start) + 3_600_000).toISOString(),
  timeZone: 'UTC',
  completed: false,
  ...extra,
})

const boards: Board[] = [
  {
    id: 'board-productivity',
    categoryId: 'productivity',
    overlapCategoryIds: ['social'],
    groups: [
      { id: 'g-low', title: 'Low Day', layout: 'compact', itemIds: ['a'], children: [{ id: 'g-sem', title: 'Seminar', layout: 'compact', itemIds: [] }] },
      { id: 'g-uns', title: 'Unsorted', layout: 'expanded', itemIds: ['series'] },
    ],
  },
]

describe('representativeTask', () => {
  const series = [
    task('s1', '2026-11-20T09:00:00Z', { seriesId: 'series' }),
    task('s2', '2026-11-22T09:00:00Z', { seriesId: 'series' }),
    task('s3', '2026-11-24T09:00:00Z', { seriesId: 'series' }),
  ]
  it("picks today's occurrence, else the next, else the last", () => {
    expect(representativeTask(series, '2026-11-22', 'UTC')?.id).toBe('s2')
    expect(representativeTask(series, '2026-11-23', 'UTC')?.id).toBe('s3')
    expect(representativeTask(series, '2026-11-30', 'UTC')?.id).toBe('s3')
  })
  it('skips occurrences taken off the schedule', () => {
    const removed = series.map((t) => (t.id === 's2' ? { ...t, unscheduled: true } : t))
    expect(representativeTask(removed, '2026-11-22', 'UTC')?.id).toBe('s3')
  })
})

describe('boardItemsFromTasks', () => {
  it('makes one chip per key, with status, lanes and the days it is scheduled', () => {
    const items = boardItemsFromTasks(
      [
        task('a', '2026-11-22T09:00:00Z', { social: true, completed: true }),
        task('s1', '2026-11-21T09:00:00Z', { seriesId: 'series', timing: 'untimed' }),
        task('s2', '2026-11-22T09:00:00Z', { seriesId: 'series', timing: 'untimed', inactive: true }),
      ],
      '2026-11-22',
      'UTC',
    )
    expect(Object.keys(items).sort()).toEqual(['a', 'series'])
    expect(items.a).toMatchObject({ status: 'done', categoryIds: ['productivity', 'social'], schedule: { instances: ['2026-11-22'] } })
    expect(items.series).toMatchObject({ status: 'inactive', schedule: { instances: ['2026-11-21', '2026-11-22'] } })
  })

  it('lists every day a multi-day task touches', () => {
    expect(taskDates(task('long', '2026-11-20T22:00:00Z', { end: '2026-11-22T02:00:00Z' }), 'UTC')).toEqual([
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
    ])
  })
})

describe('folders', () => {
  it('lists nested folders with their paths', () => {
    expect(folderOptions(boards).map((f) => f.path.join(' › '))).toEqual(['Low Day', 'Low Day › Seminar', 'Unsorted'])
    expect(folderOfKey(boards, 'series')?.id).toBe('g-uns')
    expect(defaultFolderId(boards, 'productivity')).toBe('g-uns')
  })

  it('moves a key to exactly one folder', () => {
    const moved = placeKey(boards, 'a', 'g-sem')
    expect(folderOfKey(moved, 'a')?.id).toBe('g-sem')
    expect(moved[0].groups[0].itemIds).toEqual([])
  })

  it('prunes keys whose tasks are gone', () => {
    const page = { tasks: [task('a', '2026-11-22T09:00:00Z')], boards } as unknown as PGPage
    expect(pruneBoards(page).boards[0].groups[1].itemIds).toEqual([])
  })

  it('gives a new page three empty boards with an Unsorted folder each', () => {
    const empty = emptyBoards('p2')
    expect(empty.map((b) => b.categoryId)).toEqual(['productivity', 'self-care', 'leisure'])
    expect(empty.every((b) => b.groups.length === 1 && b.groups[0].title === 'Unsorted')).toBe(true)
  })
})
