import { describe, expect, it } from 'vitest'
import { emptyBoards } from './boardTasks'
import {
  countInside,
  deletePhaseAt,
  emptyForm,
  evenSplit,
  formFromTask,
  retimeValues,
  taskFieldsFromForm,
  validateForm,
  withTiming,
  type ItemForm,
} from './taskForm'
import type { Task } from './types'

const tz = 'UTC'
const boards = emptyBoards('p')
const folderId = boards[0].groups[0].id
let n = 0
const newId = () => `id-${++n}`

function taskForm(patch: Partial<ItemForm> = {}): ItemForm {
  return {
    ...emptyForm({ kind: 'task', folderId }, new Date('2026-11-22T08:30:00Z'), tz),
    title: 'Write report',
    ...patch,
  }
}

describe('emptyForm', () => {
  it('starts a task at the next whole hour, for one hour', () => {
    const f = emptyForm({ kind: 'task' }, new Date('2026-11-22T08:30:00Z'), tz, folderId)
    expect([f.timing, f.start, f.end, f.folderId]).toEqual(['timed', '2026-11-22T09:00', '2026-11-22T10:00', folderId])
  })
  it('starts goals with no time, themes on this month', () => {
    const now = new Date('2026-11-22T08:30:00Z')
    expect(emptyForm({ kind: 'goal', horizon: 'month' }, now, tz)).toMatchObject({ timing: 'none', horizon: 'month' })
    expect(emptyForm({ kind: 'theme' }, now, tz).themeMonth).toBe('2026-11')
  })
})

describe('timing switches', () => {
  it('converts between date-times and days', () => {
    expect(retimeValues('2026-11-22T09:00', '2026-11-22T10:00', 'timed', 'all-day')).toEqual({ start: '2026-11-22', end: '2026-11-22' })
    expect(retimeValues('2026-11-22', '2026-11-24', 'all-day', 'timed')).toEqual({ start: '2026-11-22T09:00', end: '2026-11-22T10:00' })
  })
  it('drops milestones and subphases when leaving Timed', () => {
    const f = taskForm({ milestones: [{ id: 'm', label: 'x', at: '2026-11-22T09:30' }] })
    const changed = withTiming(f, 'untimed')
    expect([changed.milestones.length, changed.start, changed.end]).toEqual([0, '2026-11-22', '2026-11-22'])
  })
})

describe('validateForm (TW-5.2)', () => {
  it('needs a label and a folder', () => {
    expect(validateForm(taskForm({ title: ' ', folderId: 'nope' }), boards, tz)).toMatchObject({
      title: expect.any(String),
      folderId: expect.any(String),
    })
  })
  it('needs end after start', () => {
    expect(validateForm(taskForm({ end: '2026-11-22T08:00' }), boards, tz)).toHaveProperty('end')
  })
  it('keeps milestones inside the span', () => {
    const errors = validateForm(taskForm({ milestones: [{ id: 'm1', label: 'Late', at: '2026-11-22T11:00' }] }), boards, tz)
    expect(errors['milestone:m1']).toMatch(/between/)
  })
  it('rejects overlapping custom subphases and ones outside the parent', () => {
    const sub = (id: string, start: string, end: string) => ({ id, title: '', member: '', start, end, milestones: [], subphases: [] })
    const errors = validateForm(
      taskForm({
        split: 'custom',
        subphases: [sub('a', '2026-11-22T09:00', '2026-11-22T09:40'), sub('b', '2026-11-22T09:30', '2026-11-22T10:00'), sub('c', '2026-11-22T09:50', '2026-11-22T10:30')],
      }),
      boards,
      tz,
    )
    expect(errors['phase:b']).toMatch(/Overlaps/)
    expect(errors['phase:c']).toMatch(/inside/)
  })
  it('checks repeat endings', () => {
    const errors = validateForm(taskForm({ repeat: { preset: 'daily', every: 1, unit: 'day', ends: { type: 'on', date: '2026-11-01' } } }), boards, tz)
    expect(errors).toHaveProperty('repeat')
  })
  it('lets a goal go without a time', () => {
    expect(validateForm({ ...emptyForm({ kind: 'goal' }, new Date(), tz), title: 'Run' }, boards, tz)).toEqual({})
  })
})

describe('subphases (TW-4)', () => {
  it('splits evenly, back to back', () => {
    const parts = evenSplit('2026-11-22T09:00', '2026-11-22T12:00', 3, tz, newId)
    expect(parts.map((p) => [p.start, p.end])).toEqual([
      ['2026-11-22T09:00', '2026-11-22T10:00'],
      ['2026-11-22T10:00', '2026-11-22T11:00'],
      ['2026-11-22T11:00', '2026-11-22T12:00'],
    ])
  })

  it('deleting one takes its children and milestones, leaves siblings and a gap (TW-4.5, TW-4.6)', () => {
    const [a, b, c] = evenSplit('2026-11-22T09:00', '2026-11-22T12:00', 3, tz, newId)
    const withKids = { ...b, milestones: [{ id: 'm', label: 'x', at: '2026-11-22T10:30' }], subphases: evenSplit(b.start, b.end, 2, tz, newId), split: 'even' as const }
    expect(countInside({ ...a, subphases: [withKids] })).toEqual({ subphases: 3, milestones: 1 })

    const form = taskForm({ split: 'even', subphases: [a, withKids, c] })
    const after = deletePhaseAt(form, [b.id])
    expect(after.subphases.map((p) => p.id)).toEqual([a.id, c.id])
    expect(after.subphases[1].start).toBe('2026-11-22T11:00')
    expect(after.split).toBe('custom')
  })

  it('saves blank labels as "Phase n" and keeps members', () => {
    const [a, b] = evenSplit('2026-11-22T09:00', '2026-11-22T10:00', 2, tz, newId)
    const fields = taskFieldsFromForm(taskForm({ split: 'even', subphases: [{ ...a, member: ' Sam ' }, { ...b, title: 'Review' }] }), tz)
    expect(fields.phases?.map((p) => [p.title, p.member])).toEqual([
      ['Phase 1', 'Sam'],
      ['Review', undefined],
    ])
  })
})

describe('form ⇄ task', () => {
  it('round-trips an All Day task (last day inclusive)', () => {
    const task: Task = {
      id: 't',
      title: 'Trip',
      categoryId: 'productivity',
      timing: 'all-day',
      start: '2026-11-22T00:00:00.000Z',
      end: '2026-11-25T00:00:00.000Z',
      timeZone: tz,
      completed: false,
    }
    const form = formFromTask(task, boards, tz)
    expect([form.start, form.end]).toEqual(['2026-11-22', '2026-11-24'])
    expect(taskFieldsFromForm({ ...form, folderId }, tz)).toMatchObject({ start: task.start, end: task.end, timing: 'all-day' })
  })
})
