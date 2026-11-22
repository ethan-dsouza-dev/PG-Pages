import { describe, expect, it } from 'vitest'
import { emptyBoards, folderOfKey, tasksForKey } from './boardTasks'
import { emptyForm, formFromTask, type ItemForm } from './taskForm'
import { createFromForm, createInstance, deleteGoal, deleteSeries, instancesOf, updateTaskFromForm } from './taskSave'
import type { PGPage } from './types'

const tz = 'UTC'
const now = new Date('2026-11-22T08:30:00Z')

function page(): PGPage {
  return {
    id: 'p',
    ownerName: 'Jake',
    name: 'Page',
    version: 1,
    timeZone: tz,
    resetTime: '00:00',
    lastResetAt: '2026-11-22T00:00:00.000Z',
    goals: [{ id: 'g1', title: 'Get fit', scope: 'month', completed: false }],
    tasks: [],
    boards: emptyBoards('p'),
  }
}

const unsorted = (p: PGPage, i = 0) => p.boards[i].groups[0].id
let n = 0
const ctx = { now, newId: () => `id-${++n}` }

function taskForm(p: PGPage, patch: Partial<ItemForm> = {}): ItemForm {
  return { ...emptyForm({ kind: 'task', folderId: unsorted(p) }, now, tz), title: 'Gym', ...patch }
}

const daily = { preset: 'daily' as const, every: 1, unit: 'day' as const, ends: { type: 'after' as const, count: 4 } }

describe('createFromForm', () => {
  it('files a new task in its folder, with the folder category and goal link', () => {
    const p = page()
    const { page: next, id } = createFromForm(p, taskForm(p, { social: true, goalId: 'g1', folderId: unsorted(p, 1) }), ctx)
    expect(next.tasks).toHaveLength(1)
    expect(next.tasks[0]).toMatchObject({ id, categoryId: 'self-care', social: true, goalId: 'g1', start: '2026-11-22T09:00:00.000Z' })
    expect(folderOfKey(next.boards, id)?.id).toBe(unsorted(p, 1))
  })

  it('stores every occurrence of a repeating task as one series', () => {
    const p = page()
    const { page: next, id } = createFromForm(p, taskForm(p, { repeat: daily }), ctx)
    const series = tasksForKey(next.tasks, id)
    expect(series.map((t) => t.start.slice(0, 10))).toEqual(['2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25'])
    expect(series.every((t) => t.seriesId === id && t.repeat?.preset === 'daily')).toBe(true)
  })

  it('creates goals and themes', () => {
    const p = page()
    const goal = createFromForm(p, { ...emptyForm({ kind: 'goal', horizon: 'week' }, now, tz), title: 'Read' }, ctx).page
    expect(goal.goals.at(-1)).toMatchObject({ title: 'Read', scope: 'week', completed: false })
    const theme = createFromForm(p, { ...emptyForm({ kind: 'theme' }, now, tz), title: 'Calm' }, ctx).page
    expect(theme.goals.at(-1)).toMatchObject({ title: 'Calm', scope: 'theme', month: '2026-11' })
  })
})

describe('updateTaskFromForm (TW-6.4)', () => {
  function repeating() {
    const p = page()
    const { page: next, id } = createFromForm(p, taskForm(p, { repeat: daily }), ctx)
    const series = tasksForKey(next.tasks, id)
    return { page: next, id, series }
  }

  const moveTo10 = (p: PGPage, taskId: string) => {
    const t = p.tasks.find((x) => x.id === taskId)!
    const f = formFromTask(t, p.boards, tz)
    return { ...f, start: f.start.replace('09:00', '10:00'), end: f.end.replace('10:00', '11:00') }
  }
  const hours = (p: PGPage, key: string) => tasksForKey(p.tasks, key).map((t) => t.start.slice(11, 13))

  it('Only this one', () => {
    const { page: p, id, series } = repeating()
    expect(hours(updateTaskFromForm(p, series[1].id, moveTo10(p, series[1].id), 'this', ctx), id)).toEqual(['09', '10', '09', '09'])
  })
  it('This and following', () => {
    const { page: p, id, series } = repeating()
    expect(hours(updateTaskFromForm(p, series[1].id, moveTo10(p, series[1].id), 'following', ctx), id)).toEqual(['09', '10', '10', '10'])
  })
  it('All', () => {
    const { page: p, id, series } = repeating()
    expect(hours(updateTaskFromForm(p, series[1].id, moveTo10(p, series[1].id), 'all', ctx), id)).toEqual(['10', '10', '10', '10'])
  })

  it('a label change reaches every occurrence without moving them', () => {
    const { page: p, id, series } = repeating()
    const onlyThis = updateTaskFromForm(p, series[1].id, moveTo10(p, series[1].id), 'this', ctx)
    const f = { ...formFromTask(onlyThis.tasks.find((t) => t.id === series[0].id)!, onlyThis.boards, tz), title: 'Gym class' }
    const renamed = updateTaskFromForm(onlyThis, series[0].id, f, 'all', ctx)
    expect(tasksForKey(renamed.tasks, id).map((t) => t.title)).toEqual(Array(4).fill('Gym class'))
    expect(hours(renamed, id)).toEqual(['09', '10', '09', '09'])
  })

  it('a new repeat rule regenerates the occurrences after this one', () => {
    const { page: p, id, series } = repeating()
    const f = { ...formFromTask(series[1], p.boards, tz), repeat: { ...daily, ends: { type: 'after' as const, count: 2 } } }
    const next = updateTaskFromForm(p, series[1].id, f, 'this', ctx)
    expect(tasksForKey(next.tasks, id).map((t) => t.start.slice(0, 10))).toEqual(['2026-11-22', '2026-11-23', '2026-11-24'])
  })

  it('moves the task to its new folder', () => {
    const { page: p, id, series } = repeating()
    const f = { ...formFromTask(series[0], p.boards, tz), folderId: unsorted(p, 2) }
    const next = updateTaskFromForm(p, series[0].id, f, 'all', ctx)
    expect(folderOfKey(next.boards, id)?.id).toBe(unsorted(p, 2))
    expect(tasksForKey(next.tasks, id).every((t) => t.categoryId === 'leisure')).toBe(true)
  })
})

describe('instances and deletes', () => {
  it('createInstance adds an occurrence to the series, moving its subphases along (TW-6.1)', () => {
    const p = page()
    const f = taskForm(p, {
      split: 'even',
      subphases: [{ id: 's', title: 'Warm up', member: '', start: '2026-11-22T09:00', end: '2026-11-22T09:30', milestones: [], subphases: [] }],
    })
    const { page: one, id } = createFromForm(p, f, ctx)
    const two = createInstance(one, id, '2026-11-25T14:00:00.000Z', '2026-11-25T15:00:00.000Z', ctx)
    const list = instancesOf(two, id)
    expect(list.map((t) => t.start)).toEqual(['2026-11-25T14:00:00.000Z', '2026-11-22T09:00:00.000Z'])
    expect(list[0].phases?.[0].start).toBe('2026-11-25T14:00:00.000Z')
    expect(list.every((t) => t.seriesId === id)).toBe(true)
    expect(two.boards.flatMap((b) => b.groups.flatMap((g) => g.itemIds))).toEqual([id])
  })

  it('deleteSeries removes every occurrence and its folder entry', () => {
    const p = page()
    const { page: next, id } = createFromForm(p, taskForm(p, { repeat: daily }), ctx)
    const gone = deleteSeries(next, id)
    expect(gone.tasks).toEqual([])
    expect(folderOfKey(gone.boards, id)).toBeUndefined()
  })

  it('deleteGoal unlinks tasks that counted toward it', () => {
    const p = page()
    const { page: next } = createFromForm(p, taskForm(p, { goalId: 'g1' }), ctx)
    const after = deleteGoal(next, 'g1')
    expect(after.goals).toEqual([])
    expect(after.tasks[0].goalId).toBeUndefined()
  })
})
