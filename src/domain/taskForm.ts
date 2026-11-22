import { findFolder, folderOfKey, taskKey } from './boardTasks'
import {
  fromLocalDate,
  fromLocalDateTime,
  isLocalDate,
  isLocalDateTime,
  nextLocalDate,
  previousLocalDate,
  toLocalDate,
  toLocalDateTime,
  toLocalMonth,
} from './localTime'
import type {
  Board,
  Goal,
  GoalHorizon,
  GoalSchedule,
  Milestone,
  Phase,
  RepeatRule,
  SplitMode,
  Task,
  Timing,
} from './types'

/*
 * The New / Edit Task window's working state (TW-2, TW-3, TW-4) and the pure
 * rules around it. Times are kept as the wall-clock strings native inputs use
 * ('YYYY-MM-DDTHH:mm' for timed, 'YYYY-MM-DD' for days), read in the page's
 * time zone, and turned into ISO instants only on save.
 */

export type ItemKind = 'task' | 'goal' | 'theme'

/** 'none' is only offered on goals: a goal needn't have a time (TW-3.2a). */
export type FormTiming = Timing | 'none'

export type MilestoneDraft = { id: string; label: string; at: string }

export type PhaseDraft = {
  id: string
  /** Blank is allowed; it is shown and saved as "Phase n" (TW-4.4). */
  title: string
  member: string
  start: string
  end: string
  milestones: MilestoneDraft[]
  /** How `subphases` were split; absent while it has none. */
  split?: SplitMode
  subphases: PhaseDraft[]
}

export type ItemForm = {
  kind: ItemKind
  title: string
  /** Goals (TW-3.2). */
  horizon: GoalHorizon
  /** Themes: 'YYYY-MM' (TW-3.3a). */
  themeMonth: string
  /** Tasks (TW-3.4, TW-3.5, TW-3.12). */
  folderId: string
  social: boolean
  goalId: string
  timing: FormTiming
  /** Timed: local date-time. All Day: first day. Not timed: the day. */
  start: string
  /** Timed: local date-time. All Day: last day (inclusive). Not timed: unused. */
  end: string
  repeat: RepeatRule | null
  milestones: MilestoneDraft[]
  split?: SplitMode
  subphases: PhaseDraft[]
}

export type IdMaker = () => string
export const randomId: IdMaker = () => crypto.randomUUID()

/* ---------- Defaults ---------- */

/** What a "+" fills in (TW-1.3). */
export type Prefill = Partial<Pick<ItemForm, 'kind' | 'horizon' | 'folderId' | 'social' | 'timing'>>

/** Today's local date and the next whole hour, for new items. */
export function defaultTimes(now: Date, timeZone: string): { start: string; end: string } {
  const nextHour = new Date(Math.ceil((now.getTime() + 1) / 3_600_000) * 3_600_000)
  return {
    start: toLocalDateTime(nextHour.toISOString(), timeZone),
    end: toLocalDateTime(new Date(nextHour.getTime() + 3_600_000).toISOString(), timeZone),
  }
}

export function emptyForm(prefill: Prefill, now: Date, timeZone: string, defaultFolderId = ''): ItemForm {
  const kind = prefill.kind ?? 'task'
  const times = defaultTimes(now, timeZone)
  const timing: FormTiming = prefill.timing ?? (kind === 'task' ? 'timed' : 'none')
  return {
    kind,
    title: '',
    horizon: prefill.horizon ?? 'day',
    themeMonth: toLocalMonth(now.toISOString(), timeZone),
    folderId: prefill.folderId ?? defaultFolderId,
    social: prefill.social ?? false,
    goalId: '',
    timing,
    ...retimeValues(times.start, times.end, 'timed', timing === 'none' ? 'timed' : timing),
    repeat: null,
    milestones: [],
    subphases: [],
  }
}

/* ---------- Timing switches ---------- */

const DEFAULT_START_TIME = 'T09:00'
const DEFAULT_END_TIME = 'T10:00'

/** Converts start/end strings when the timing type changes. */
export function retimeValues(start: string, end: string, from: Timing, to: Timing): { start: string; end: string } {
  if (from === to) return { start, end }
  const startDay = start.slice(0, 10)
  const endDay = (from === 'untimed' ? start : end).slice(0, 10) || startDay
  if (to === 'timed') {
    return { start: `${startDay}${DEFAULT_START_TIME}`, end: `${startDay}${DEFAULT_END_TIME}` }
  }
  if (to === 'all-day') return { start: startDay, end: endDay < startDay ? startDay : endDay }
  return { start: startDay, end: startDay }
}

/** The form with a new timing; milestones and subphases need a time sheet, so they go when leaving Timed. */
export function withTiming(form: ItemForm, timing: FormTiming): ItemForm {
  if (timing === form.timing) return form
  const from: Timing = form.timing === 'none' ? 'timed' : form.timing
  const to: Timing = timing === 'none' ? 'timed' : timing
  const times = retimeValues(form.start, form.end, from, to)
  const keepsSheet = timing === 'timed'
  return {
    ...form,
    timing,
    ...times,
    ...(keepsSheet ? {} : { milestones: [], subphases: [], split: undefined }),
  }
}

/* ---------- Subphases ---------- */

/** `count` equal back-to-back subphases between two local date-times (TW-4.1 "Even"). */
export function evenSplit(start: string, end: string, count: number, timeZone: string, newId: IdMaker = randomId): PhaseDraft[] {
  const s = fromLocalDateTime(start, timeZone)
  const e = fromLocalDateTime(end, timeZone)
  const n = Math.max(1, Math.min(MAX_SPLIT, Math.floor(count)))
  if (!s || !e || e <= s) return []
  const step = (e.getTime() - s.getTime()) / n
  const at = (i: number) =>
    i === n ? end : toLocalDateTime(new Date(Math.round((s.getTime() + i * step) / 60_000) * 60_000).toISOString(), timeZone)
  return Array.from({ length: n }, (_, i) => ({
    id: newId(),
    title: '',
    member: '',
    start: i === 0 ? start : at(i),
    end: at(i + 1),
    milestones: [],
    subphases: [],
  }))
}

export const MAX_SPLIT = 12

/** The drafts along `path` (ids from the top), or null if any id is missing. */
export function phaseAt(root: { subphases: PhaseDraft[] }, path: readonly string[]): PhaseDraft | null {
  let node: { subphases: PhaseDraft[] } = root
  let found: PhaseDraft | null = null
  for (const id of path) {
    found = node.subphases.find((p) => p.id === id) ?? null
    if (!found) return null
    node = found
  }
  return found
}

/** Replaces the phase at `path` with `update(phase)`. */
export function updatePhaseAt(form: ItemForm, path: readonly string[], update: (p: PhaseDraft) => PhaseDraft): ItemForm {
  const go = (list: PhaseDraft[], depth: number): PhaseDraft[] =>
    list.map((p) => {
      if (p.id !== path[depth]) return p
      return depth === path.length - 1 ? update(p) : { ...p, subphases: go(p.subphases, depth + 1) }
    })
  return path.length === 0 ? form : { ...form, subphases: go(form.subphases, 0) }
}

/**
 * Deletes the phase at `path` with everything inside it (TW-4.5). Siblings
 * keep their times; the deleted span becomes an empty gap (TW-4.6).
 */
export function deletePhaseAt(form: ItemForm, path: readonly string[]): ItemForm {
  const go = (list: PhaseDraft[], depth: number): PhaseDraft[] =>
    depth === path.length - 1
      ? list.filter((p) => p.id !== path[depth])
      : list.map((p) => (p.id === path[depth] ? withoutEmptySplit({ ...p, subphases: go(p.subphases, depth + 1) }) : p))
  if (path.length === 0) return form
  const subphases = go(form.subphases, 0)
  // A gap means the split is no longer even; record it as custom so the times show.
  const split: SplitMode | undefined = path.length === 1 ? (subphases.length ? 'custom' : undefined) : form.split
  return { ...form, subphases, split }
}

function withoutEmptySplit(p: PhaseDraft): PhaseDraft {
  if (p.subphases.length === 0) return { ...p, split: undefined }
  return { ...p, split: 'custom' }
}

/** How many subphases and milestones sit inside a phase (for the delete confirmation, TW-4.7). */
export function countInside(phase: PhaseDraft): { subphases: number; milestones: number } {
  let subphases = 0
  let milestones = 0
  for (const child of phase.subphases) {
    const inner = countInside(child)
    subphases += 1 + inner.subphases
    milestones += child.milestones.length + inner.milestones
  }
  return { subphases, milestones }
}

/** "Phase 2" style fallback names, by position. */
export function phaseDisplayName(phase: PhaseDraft | Phase, index: number): string {
  return phase.title.trim() || `Phase ${index + 1}`
}

/* ---------- Validation (TW-5.2) ---------- */

/** Field path → message. Paths: 'title', 'folderId', 'start', 'end', 'repeat', 'milestone:<id>', 'phase:<id>'. */
export type FormErrors = Record<string, string>

type Span = { start: number; end: number }

function spanOf(start: string, end: string, timeZone: string): Span | null {
  const s = fromLocalDateTime(start, timeZone)
  const e = fromLocalDateTime(end, timeZone)
  return s && e && e > s ? { start: s.getTime(), end: e.getTime() } : null
}

export function validateForm(form: ItemForm, boards: readonly Board[], timeZone: string): FormErrors {
  const errors: FormErrors = {}
  if (!form.title.trim()) errors.title = 'Add a label.'
  if (form.kind === 'task' && !findFolder(boards, form.folderId)) errors.folderId = 'Choose a folder.'
  if (form.kind === 'theme' && !/^\d{4}-\d{2}$/.test(form.themeMonth)) errors.themeMonth = 'Choose a month.'

  if (form.kind !== 'theme' && form.timing !== 'none') {
    if (form.timing === 'timed') {
      if (!isLocalDateTime(form.start)) errors.start = 'Enter a start date and time.'
      if (!isLocalDateTime(form.end)) errors.end = 'Enter an end date and time.'
      else if (!errors.start && form.end <= form.start) errors.end = 'End must be after start.'
    } else {
      if (!isLocalDate(form.start)) errors.start = 'Enter a date.'
      if (form.timing === 'all-day') {
        if (!isLocalDate(form.end)) errors.end = 'Enter the last day.'
        else if (!errors.start && form.end < form.start) errors.end = 'The last day can’t be before the first.'
      }
    }
    const repeatError = form.repeat && validateRepeat(form.repeat, form.start.slice(0, 10))
    if (repeatError) errors.repeat = repeatError
  }

  if (form.kind === 'task' && form.timing === 'timed' && !errors.start && !errors.end) {
    const span = spanOf(form.start, form.end, timeZone)
    if (span) {
      checkMilestones(form.milestones, span, timeZone, errors)
      checkPhases(form.subphases, form.split, span, timeZone, errors)
    }
  }
  return errors
}

function validateRepeat(rule: RepeatRule, startDay: string): string | null {
  if (!Number.isInteger(rule.every) || rule.every < 1) return 'Repeat every 1 or more.'
  if (rule.ends.type === 'on' && (!isLocalDate(rule.ends.date) || rule.ends.date < startDay)) {
    return 'The end date must be on or after the start.'
  }
  if (rule.ends.type === 'after' && (!Number.isInteger(rule.ends.count) || rule.ends.count < 1)) {
    return 'Repeat at least once.'
  }
  return null
}

function checkMilestones(list: MilestoneDraft[], span: Span, timeZone: string, errors: FormErrors) {
  for (const m of list) {
    const at = fromLocalDateTime(m.at, timeZone)
    if (!m.label.trim()) errors[`milestone:${m.id}`] = 'Add a label.'
    else if (!at) errors[`milestone:${m.id}`] = 'Enter a date and time.'
    else if (at.getTime() < span.start || at.getTime() > span.end) {
      errors[`milestone:${m.id}`] = 'Must be between the start and end.'
    }
  }
}

function checkPhases(list: PhaseDraft[], split: SplitMode | undefined, parent: Span, timeZone: string, errors: FormErrors) {
  const spans: { id: string; span: Span }[] = []
  for (const p of list) {
    const span = spanOf(p.start, p.end, timeZone)
    if (!span) {
      errors[`phase:${p.id}`] = 'End must be after start.'
      continue
    }
    if (span.start < parent.start || span.end > parent.end) {
      errors[`phase:${p.id}`] = 'Must stay inside its parent’s time.'
      continue
    }
    spans.push({ id: p.id, span })
    checkMilestones(p.milestones, span, timeZone, errors)
    checkPhases(p.subphases, p.split, span, timeZone, errors)
  }
  if (split === 'custom') {
    const sorted = [...spans].sort((a, b) => a.span.start - b.span.start)
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].span.start < sorted[i - 1].span.end) errors[`phase:${sorted[i].id}`] = 'Overlaps another subphase.'
    }
  }
}

/** The first field with an error, in the order the window shows them. */
export function firstErrorKey(errors: FormErrors): string | undefined {
  const order = ['title', 'themeMonth', 'folderId', 'start', 'end', 'repeat']
  return order.find((k) => k in errors) ?? Object.keys(errors)[0]
}

/* ---------- Form ⇄ domain ---------- */

const toMilestoneDraft = (m: Milestone, tz: string): MilestoneDraft => ({ id: m.id, label: m.label, at: toLocalDateTime(m.at, tz) })

function toPhaseDraft(p: Phase, tz: string): PhaseDraft {
  return {
    id: p.id,
    title: p.title,
    member: p.member ?? '',
    start: toLocalDateTime(p.start, tz),
    end: toLocalDateTime(p.end, tz),
    milestones: (p.milestones ?? []).map((m) => toMilestoneDraft(m, tz)),
    split: p.subphases?.length ? (p.split ?? 'custom') : undefined,
    subphases: (p.subphases ?? []).map((c) => toPhaseDraft(c, tz)),
  }
}

/** Local start/end strings for a stored span with this timing. */
function localSpan(timing: Timing, start: string, end: string, tz: string): { start: string; end: string } {
  if (timing === 'timed') return { start: toLocalDateTime(start, tz), end: toLocalDateTime(end, tz) }
  const first = toLocalDate(start, tz)
  const last = previousLocalDate(toLocalDate(end, tz))
  return { start: first, end: last < first ? first : last }
}

export function formFromTask(task: Task, boards: readonly Board[], tz: string): ItemForm {
  const timing: Timing = task.timing ?? 'timed'
  return {
    kind: 'task',
    title: task.title,
    horizon: 'day',
    themeMonth: toLocalMonth(task.start, tz),
    folderId: folderOfKey(boards, taskKey(task))?.id ?? '',
    social: task.social ?? false,
    goalId: task.goalId ?? '',
    timing,
    ...localSpan(timing, task.start, task.end, tz),
    repeat: task.repeat ?? null,
    milestones: (task.milestones ?? []).map((m) => toMilestoneDraft(m, tz)),
    split: task.phases?.length ? (task.split ?? 'custom') : undefined,
    subphases: (task.phases ?? []).map((p) => toPhaseDraft(p, tz)),
  }
}

export function formFromGoal(goal: Goal, now: Date, tz: string): ItemForm {
  const base = emptyForm({ kind: goal.scope === 'theme' ? 'theme' : 'goal' }, now, tz)
  const schedule = goal.schedule
  return {
    ...base,
    title: goal.title,
    horizon: goal.scope === 'theme' ? 'day' : goal.scope,
    themeMonth: goal.month ?? base.themeMonth,
    ...(schedule
      ? { timing: schedule.timing, ...localSpan(schedule.timing, schedule.start, schedule.end, tz), repeat: schedule.repeat ?? null }
      : {}),
  }
}

/** The stored fields a task form describes, for one occurrence (ISO instants). */
export type TaskFields = Pick<Task, 'title' | 'start' | 'end' | 'phases' | 'split' | 'milestones' | 'repeat'> & {
  timing?: Task['timing']
}

/** ISO start/end for a validated form's span. */
export function formSpan(form: Pick<ItemForm, 'timing' | 'start' | 'end'>, tz: string): { start: string; end: string } {
  if (form.timing === 'timed' || form.timing === 'none') {
    return { start: fromLocalDateTime(form.start, tz)!.toISOString(), end: fromLocalDateTime(form.end, tz)!.toISOString() }
  }
  const last = form.timing === 'all-day' ? form.end : form.start
  return { start: fromLocalDate(form.start, tz)!.toISOString(), end: fromLocalDate(nextLocalDate(last), tz)!.toISOString() }
}

const fromMilestoneDraft = (m: MilestoneDraft, tz: string): Milestone => ({
  id: m.id,
  label: m.label.trim(),
  at: fromLocalDateTime(m.at, tz)!.toISOString(),
})

function fromPhaseDraft(p: PhaseDraft, index: number, tz: string): Phase {
  const phase: Phase = {
    id: p.id,
    title: phaseDisplayName(p, index),
    start: fromLocalDateTime(p.start, tz)!.toISOString(),
    end: fromLocalDateTime(p.end, tz)!.toISOString(),
  }
  if (p.member.trim()) phase.member = p.member.trim()
  if (p.milestones.length) phase.milestones = p.milestones.map((m) => fromMilestoneDraft(m, tz))
  if (p.subphases.length) {
    phase.split = p.split ?? 'custom'
    phase.subphases = p.subphases.map((c, i) => fromPhaseDraft(c, i, tz))
  }
  return phase
}

/** A validated task form as stored fields. */
export function taskFieldsFromForm(form: ItemForm, tz: string): TaskFields {
  const timed = form.timing === 'timed'
  const fields: TaskFields = { title: form.title.trim(), ...formSpan(form, tz) }
  if (form.timing === 'all-day' || form.timing === 'untimed') fields.timing = form.timing
  if (form.repeat) fields.repeat = form.repeat
  if (timed && form.milestones.length) fields.milestones = form.milestones.map((m) => fromMilestoneDraft(m, tz))
  if (timed && form.subphases.length) {
    fields.split = form.split ?? 'custom'
    fields.phases = form.subphases.map((p, i) => fromPhaseDraft(p, i, tz))
  }
  return fields
}

/** A validated goal or theme form as a goal's stored fields. */
export function goalFieldsFromForm(form: ItemForm, tz: string): Omit<Goal, 'id' | 'completed'> {
  if (form.kind === 'theme') return { title: form.title.trim(), scope: 'theme', month: form.themeMonth }
  const fields: Omit<Goal, 'id' | 'completed'> = { title: form.title.trim(), scope: form.horizon }
  if (form.timing !== 'none') {
    const schedule: GoalSchedule = { timing: form.timing, ...formSpan(form, tz) }
    if (form.repeat) schedule.repeat = form.repeat
    fields.schedule = schedule
  }
  return fields
}

/** True when two forms would save the same thing (for the unsaved-changes check, TW-5.3). */
export function sameForm(a: ItemForm, b: ItemForm): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/** True when the edit moves the occurrence in time (TW-6.4 asks which occurrences to change). */
export function changesTime(before: ItemForm, after: ItemForm): boolean {
  return before.timing !== after.timing || before.start !== after.start || before.end !== after.end
}

export function sameRepeat(a: RepeatRule | null | undefined, b: RepeatRule | null | undefined): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}
