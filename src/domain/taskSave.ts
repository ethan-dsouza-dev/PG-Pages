import { TZDate } from '@date-fns/tz'
import { addDays, differenceInCalendarDays } from 'date-fns'
import { findFolder, placeKey, pruneBoards, taskKey, tasksForKey } from './boardTasks'
import { horizonFor, occurrences } from './repeat'
import {
  goalFieldsFromForm,
  randomId,
  sameRepeat,
  taskFieldsFromForm,
  type IdMaker,
  type ItemForm,
  type TaskFields,
} from './taskForm'
import type { Goal, Milestone, PGPage, Phase, Task } from './types'

/*
 * Saving the New / Edit Task window (TW-5, TW-6) as pure page reducers.
 * Unchanged tasks keep their identity, like the other reducers.
 */

export type SaveContext = { now: Date; newId?: IdMaker }

/** TW-6.4: which occurrences of a repeating task an edit to its time changes. */
export type EditScope = 'this' | 'following' | 'all'

/* ---------- Shifting ---------- */

function shiftIso(iso: string, days: number, ms: number, tz: string): string {
  const shifted = days ? addDays(new TZDate(iso, tz), days) : new TZDate(iso, tz)
  return new Date(shifted.getTime() + ms).toISOString()
}

function shiftMilestones(list: Milestone[] | undefined, days: number, ms: number, tz: string): Milestone[] | undefined {
  return list?.map((m) => ({ ...m, at: shiftIso(m.at, days, ms, tz) }))
}

function shiftPhases(list: Phase[] | undefined, days: number, ms: number, tz: string): Phase[] | undefined {
  return list?.map((p) => ({
    ...p,
    start: shiftIso(p.start, days, ms, tz),
    end: shiftIso(p.end, days, ms, tz),
    ...(p.milestones ? { milestones: shiftMilestones(p.milestones, days, ms, tz) } : {}),
    ...(p.subphases ? { subphases: shiftPhases(p.subphases, days, ms, tz) } : {}),
  }))
}

/** The same fields moved by whole calendar days (keeps wall-clock times across DST). */
function shiftFields(fields: TaskFields, days: number, tz: string, newId?: IdMaker): TaskFields {
  const shifted: TaskFields = {
    ...fields,
    start: shiftIso(fields.start, days, 0, tz),
    end: shiftIso(fields.end, days, 0, tz),
  }
  if (fields.phases) shifted.phases = withFreshIds(shiftPhases(fields.phases, days, 0, tz)!, newId)
  if (fields.milestones) shifted.milestones = shiftMilestones(fields.milestones, days, 0, tz)!.map((m) => ({ ...m, id: newId ? newId() : m.id }))
  return shifted
}

function withFreshIds(phases: Phase[], newId?: IdMaker): Phase[] {
  if (!newId) return phases
  return phases.map((p) => ({
    ...p,
    id: newId(),
    ...(p.milestones ? { milestones: p.milestones.map((m) => ({ ...m, id: newId() })) } : {}),
    ...(p.subphases ? { subphases: withFreshIds(p.subphases, newId) } : {}),
  }))
}

/** Same fields, moved so they start at `start` (by exact milliseconds). */
function moveTo(task: Task, start: string, end: string, newId: IdMaker): Pick<Task, 'start' | 'end' | 'phases' | 'milestones'> {
  const ms = Date.parse(start) - Date.parse(task.start)
  return {
    start,
    end,
    phases: task.phases ? withFreshIds(shiftPhases(task.phases, 0, ms, 'UTC')!, newId) : undefined,
    milestones: task.milestones ? shiftMilestones(task.milestones, 0, ms, 'UTC')!.map((m) => ({ ...m, id: newId() })) : undefined,
  }
}

const daysBetween = (fromIso: string, toIso: string, tz: string) =>
  differenceInCalendarDays(new TZDate(toIso, tz), new TZDate(fromIso, tz))

/** Drops keys whose value is undefined, so stored tasks stay tidy. */
function compact<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T
}

/* ---------- Create ---------- */

/** Tasks for a new series (or one task) from validated fields. */
function buildSeries(
  fields: TaskFields,
  shared: Pick<Task, 'categoryId' | 'social' | 'goalId' | 'timeZone'>,
  key: string,
  ctx: Required<SaveContext>,
): Task[] {
  const base = (f: TaskFields, id: string, seriesId?: string): Task =>
    compact({ ...shared, ...f, id, seriesId, completed: false, social: shared.social || undefined, goalId: shared.goalId || undefined })
  if (!fields.repeat) return [base(fields, key)]
  const tz = shared.timeZone
  const spans = occurrences(fields, fields.repeat, tz, horizonFor(fields, ctx.now))
  if (spans.length === 0) return [base(fields, key)]
  return spans.map((span, i) => {
    const f = i === 0 && span.start === fields.start ? fields : shiftFields(fields, daysBetween(fields.start, span.start, tz), tz, ctx.newId)
    return base({ ...f, start: span.start, end: span.end }, i === 0 ? key : ctx.newId(), key)
  })
}

function sharedFromForm(page: PGPage, form: ItemForm): Pick<Task, 'categoryId' | 'social' | 'goalId' | 'timeZone'> {
  const folder = findFolder(page.boards, form.folderId)
  if (!folder) throw new Error(`Unknown folder "${form.folderId}"`)
  return { categoryId: folder.categoryId, social: form.social, goalId: form.goalId || undefined, timeZone: page.timeZone }
}

/** Saves a New (or Duplicate) form: a task in its folder, or a goal or theme. Returns the page and the new id. */
export function createFromForm(page: PGPage, form: ItemForm, context: SaveContext): { page: PGPage; id: string } {
  const ctx = { now: context.now, newId: context.newId ?? randomId }
  const id = ctx.newId()
  if (form.kind !== 'task') {
    const goal: Goal = { id, completed: false, ...goalFieldsFromForm(form, page.timeZone) }
    return { page: { ...page, goals: [...page.goals, goal] }, id }
  }
  const tasks = buildSeries(taskFieldsFromForm(form, page.timeZone), sharedFromForm(page, form), id, ctx)
  return {
    page: { ...page, tasks: [...page.tasks, ...tasks], boards: placeKey(page.boards, id, form.folderId) },
    id,
  }
}

/* ---------- Edit ---------- */

/**
 * Saves an Edit form onto task `taskId` (TW-5.5, TW-6.4).
 * - Label, folder, social, and goal link change on every occurrence.
 * - Time, milestones, and subphases change on the occurrences `scope` picks,
 *   each moved by its own calendar-day distance from the edited one.
 * - A changed repeat regenerates the occurrences after this one.
 */
export function updateTaskFromForm(
  page: PGPage,
  taskId: string,
  form: ItemForm,
  scope: EditScope,
  context: SaveContext,
): PGPage {
  const ctx = { now: context.now, newId: context.newId ?? randomId }
  const target = page.tasks.find((t) => t.id === taskId)
  if (!target) return page
  const tz = page.timeZone
  const key = taskKey(target)
  const series = tasksForKey(page.tasks, key)
  const shared = sharedFromForm(page, form)
  const fields = taskFieldsFromForm(form, tz)
  const repeatChanged = !sameRepeat(target.repeat, fields.repeat)
  const targetStart = Date.parse(target.start)
  // Unchanged time: other occurrences keep their own times (they may have been moved one by one).
  const timeChanged = fields.start !== target.start || fields.end !== target.end || fields.timing !== target.timing

  const inScope = (t: Task) =>
    t.id === target.id || scope === 'all' || (scope === 'following' && Date.parse(t.start) > targetStart)

  // A new repeat rule replaces everything after this occurrence.
  const dropped = new Set(repeatChanged ? series.filter((t) => Date.parse(t.start) > targetStart).map((t) => t.id) : [])

  const updated = new Map<string, Task>()
  for (const t of series) {
    if (dropped.has(t.id)) continue
    const own: Partial<Task> = !inScope(t)
      ? {}
      : t.id === target.id
        ? fields
        : timeChanged
          ? shiftFields(fields, daysBetween(target.start, t.start, tz), tz)
          : keepOwnTime(t, fields)
    const next = compact({
      ...t,
      ...own,
      ...(inScope(t) && (t.id === target.id || timeChanged) ? { timing: fields.timing } : {}),
      title: fields.title,
      categoryId: shared.categoryId,
      social: shared.social || undefined,
      goalId: shared.goalId,
      repeat: fields.repeat,
    })
    if (!inScope(t)) {
      // Keep this occurrence's own time and sheet details.
      next.phases = t.phases
      next.milestones = t.milestones
      next.split = t.split
    }
    updated.set(t.id, compact(next))
  }

  let added: Task[] = []
  if (repeatChanged && fields.repeat) {
    const edited = updated.get(target.id)!
    const spans = occurrences(edited, fields.repeat, tz, horizonFor(edited, ctx.now)).filter(
      (s) => Date.parse(s.start) > Date.parse(edited.start),
    )
    added = spans.map((span) => {
      const f = shiftFields(fields, daysBetween(edited.start, span.start, tz), tz, ctx.newId)
      return compact({ ...edited, ...f, id: ctx.newId(), start: span.start, end: span.end, completed: false, unscheduled: undefined, seriesId: key })
    })
    if (added.length) updated.set(target.id, { ...edited, seriesId: key })
  }

  const tasks = page.tasks.filter((t) => !dropped.has(t.id)).map((t) => updated.get(t.id) ?? t)
  return pruneBoards({ ...page, tasks: [...tasks, ...added], boards: placeKey(page.boards, key, form.folderId) })
}

/** The form's details on occurrence `t`, at `t`'s own time: subphases and milestones move with it. */
function keepOwnTime(t: Task, fields: TaskFields): Partial<Task> {
  const ms = Date.parse(t.start) - Date.parse(fields.start)
  return {
    ...fields,
    start: t.start,
    end: t.end,
    phases: shiftPhases(fields.phases, 0, ms, 'UTC'),
    milestones: shiftMilestones(fields.milestones, 0, ms, 'UTC'),
  }
}

/** Saves an Edit form onto a goal or theme. */
export function updateGoalFromForm(page: PGPage, goalId: string, form: ItemForm): PGPage {
  const fields = goalFieldsFromForm(form, page.timeZone)
  return {
    ...page,
    goals: page.goals.map((g) => (g.id === goalId ? compact({ id: g.id, completed: g.completed, ...fields }) : g)),
  }
}

/* ---------- Instances (TW-6) ---------- */

/** Every occurrence of the task's series, newest first (TW-6.2). */
export function instancesOf(page: PGPage, taskId: string): Task[] {
  const task = page.tasks.find((t) => t.id === taskId)
  if (!task) return []
  return tasksForKey(page.tasks, taskKey(task)).reverse()
}

/**
 * TW-6.1 / LP-6.7: another occurrence of the same task at `start`–`end`
 * (ISO). The task's details come along; the new occurrence starts unchecked.
 */
export function createInstance(page: PGPage, taskId: string, start: string, end: string, context: SaveContext): PGPage {
  const newId = context.newId ?? randomId
  const source = page.tasks.find((t) => t.id === taskId)
  if (!source || Date.parse(end) <= Date.parse(start)) return page
  const key = taskKey(source)
  const instance: Task = compact({
    ...source,
    ...moveTo(source, start, end, newId),
    id: newId(),
    seriesId: key,
    completed: false,
    unscheduled: undefined,
  })
  const tasks = page.tasks.map((t) => (taskKey(t) === key && t.seriesId === undefined ? { ...t, seriesId: key } : t))
  return { ...page, tasks: [...tasks, instance] }
}

/* ---------- Deletes ---------- */

/** Deletes every occurrence listed under a board key (a board chip's Delete). */
export function deleteSeries(page: PGPage, key: string): PGPage {
  if (!page.tasks.some((t) => taskKey(t) === key)) return page
  return pruneBoards({ ...page, tasks: page.tasks.filter((t) => taskKey(t) !== key) })
}

/** Deletes a goal or theme, unlinking tasks that counted toward it. */
export function deleteGoal(page: PGPage, goalId: string): PGPage {
  if (!page.goals.some((g) => g.id === goalId)) return page
  return {
    ...page,
    goals: page.goals.filter((g) => g.id !== goalId),
    tasks: page.tasks.map((t) => (t.goalId === goalId ? compact({ ...t, goalId: undefined }) : t)),
  }
}
