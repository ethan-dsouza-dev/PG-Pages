import { addDays, startOfDay } from 'date-fns'
import { TZDate } from '@date-fns/tz'
import { toLocalDate } from './localTime'
import type { Board, BoardGroup, BoardItem, CategoryId, PGPage, Task } from './types'

/*
 * TW-OQ-1: boards and the timeline share one source of truth, the page's
 * tasks. A board group lists task keys; a key names one task, or a whole
 * repeating series (every occurrence shares `seriesId`). Board chips are
 * derived from tasks here, so the board components keep their BoardItem shape.
 */

export const SOCIAL_CATEGORY: CategoryId = 'social'
/** Every board has a group with this title; new tasks land there by default. */
export const UNSORTED_TITLE = 'Unsorted'

/** The key boards use for a task: its series, or the task itself. */
export function taskKey(task: Task): string {
  return task.seriesId ?? task.id
}

/** Every task stored under `key`, earliest first. */
export function tasksForKey(tasks: readonly Task[], key: string): Task[] {
  return tasks
    .filter((t) => taskKey(t) === key)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
}

/**
 * The occurrence a board chip stands for: the scheduled one on `today`, else
 * the next scheduled one, else the most recent one.
 */
export function representativeTask(series: readonly Task[], today: string, timeZone: string): Task | undefined {
  if (series.length === 0) return undefined
  const scheduled = series.filter((t) => !t.unscheduled)
  const onToday = scheduled.find((t) => taskDates(t, timeZone).includes(today))
  if (onToday) return onToday
  const upcoming = scheduled.find((t) => toLocalDate(t.start, timeZone) > today)
  return upcoming ?? series[series.length - 1]
}

/** Longest run of calendar days one task is listed under (keeps long spans cheap). */
const MAX_TASK_DATES = 62

/** The calendar days ('YYYY-MM-DD') a task touches, in `timeZone`. */
export function taskDates(task: Task, timeZone: string): string[] {
  const dates: string[] = []
  const end = Date.parse(task.end)
  let day = startOfDay(new TZDate(task.start, timeZone))
  while (day.getTime() < end && dates.length < MAX_TASK_DATES) {
    dates.push(toLocalDate(new Date(day.getTime()).toISOString(), timeZone))
    day = addDays(day, 1)
  }
  return dates.length > 0 ? dates : [toLocalDate(task.start, timeZone)]
}

/** The categories a task belongs to, as board lanes read them. */
export function taskCategoryIds(task: Task): CategoryId[] {
  return task.social ? [task.categoryId, SOCIAL_CATEGORY] : [task.categoryId]
}

/** A board chip for one key. */
export function boardItemFor(series: readonly Task[], today: string, timeZone: string): BoardItem | undefined {
  const rep = representativeTask(series, today, timeZone)
  if (!rep) return undefined
  const instances = [...new Set(series.filter((t) => !t.unscheduled).flatMap((t) => taskDates(t, timeZone)))]
  const timed = rep.timing === undefined
  return {
    id: taskKey(rep),
    title: rep.title,
    status: rep.inactive ? 'inactive' : rep.completed ? 'done' : 'todo',
    categoryIds: taskCategoryIds(rep),
    ...(timed && rep.phases?.length ? { span: { start: rep.start, end: rep.end }, phases: rep.phases } : {}),
    ...(instances.length ? { schedule: { instances } } : {}),
  }
}

/** Board chips for every task on the page, keyed by task key. */
export function boardItemsFromTasks(tasks: readonly Task[], today: string, timeZone: string): Record<string, BoardItem> {
  const byKey = new Map<string, Task[]>()
  for (const t of tasks) {
    const key = taskKey(t)
    const list = byKey.get(key)
    if (list) list.push(t)
    else byKey.set(key, [t])
  }
  const items: Record<string, BoardItem> = {}
  for (const [key, series] of byKey) {
    series.sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
    const item = boardItemFor(series, today, timeZone)
    if (item) items[key] = item
  }
  return items
}

/* ---------- Folders ---------- */

/** One choosable folder, with its path for display ("Productivity › Low Day"). */
export type FolderOption = {
  id: string
  categoryId: CategoryId
  /** Titles from the top-level group down to this one. */
  path: string[]
}

function* walk(groups: readonly BoardGroup[], trail: string[]): Generator<[BoardGroup, string[]]> {
  for (const g of groups) {
    const path = [...trail, g.title]
    yield [g, path]
    if (g.children) yield* walk(g.children, path)
  }
}

/** Every folder on the page's boards, board by board, depth first (TW-3.4). */
export function folderOptions(boards: readonly Board[]): FolderOption[] {
  return boards.flatMap((b) => [...walk(b.groups, [])].map(([g, path]) => ({ id: g.id, categoryId: b.categoryId, path })))
}

export function findFolder(boards: readonly Board[], folderId: string): FolderOption | undefined {
  return folderOptions(boards).find((f) => f.id === folderId)
}

/** The folder that lists `key`, if any. */
export function folderOfKey(boards: readonly Board[], key: string): FolderOption | undefined {
  for (const b of boards) {
    for (const [g, path] of walk(b.groups, [])) {
      if (g.itemIds.includes(key)) return { id: g.id, categoryId: b.categoryId, path }
    }
  }
  return undefined
}

/** A category's default folder: its "Unsorted" group, else its first group. */
export function defaultFolderId(boards: readonly Board[], categoryId: CategoryId): string | undefined {
  const board = boards.find((b) => b.categoryId === categoryId)
  if (!board) return undefined
  return (board.groups.find((g) => g.title === UNSORTED_TITLE) ?? board.groups[0])?.id
}

function mapGroups(groups: BoardGroup[], fn: (g: BoardGroup) => BoardGroup): BoardGroup[] {
  return groups.map((g) => {
    const children = g.children ? mapGroups(g.children, fn) : undefined
    return fn(children === g.children ? g : { ...g, children })
  })
}

/** Lists `key` in `folderId` only (appended at the end), taking it out of any other folder. */
export function placeKey(boards: Board[], key: string, folderId: string): Board[] {
  return boards.map((b) => ({
    ...b,
    groups: mapGroups(b.groups, (g) => {
      const listed = g.itemIds.includes(key)
      if (g.id === folderId) return listed ? g : { ...g, itemIds: [...g.itemIds, key] }
      return listed ? { ...g, itemIds: g.itemIds.filter((id) => id !== key) } : g
    }),
  }))
}

/** Takes `key` out of every folder. */
export function unlistKey(boards: Board[], key: string): Board[] {
  return placeKey(boards, key, '')
}

/** Drops keys that no longer have any task (after deletes). */
export function pruneBoards(page: PGPage): PGPage {
  const keys = new Set(page.tasks.map(taskKey))
  let changed = false
  const boards = page.boards.map((b) => ({
    ...b,
    groups: mapGroups(b.groups, (g) => {
      const kept = g.itemIds.filter((id) => keys.has(id))
      if (kept.length === g.itemIds.length) return g
      changed = true
      return { ...g, itemIds: kept }
    }),
  }))
  return changed ? { ...page, boards } : page
}

/** The three fixed boards (LP-7.1), each with an empty "Unsorted" folder. */
export function emptyBoards(idPrefix: string): Board[] {
  return (['productivity', 'self-care', 'leisure'] as const).map((categoryId) => ({
    id: `board-${categoryId}`,
    categoryId,
    overlapCategoryIds: [SOCIAL_CATEGORY],
    groups: [{ id: `${idPrefix}-${categoryId}-unsorted`, title: UNSORTED_TITLE, layout: 'expanded', itemIds: [] }],
  }))
}
