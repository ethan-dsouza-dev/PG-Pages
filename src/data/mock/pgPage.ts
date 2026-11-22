import { TZDate } from '@date-fns/tz'
import { addDays, startOfDay } from 'date-fns'
import { SOCIAL_CATEGORY, UNSORTED_TITLE } from '../../domain/boardTasks'
import { DEFAULT_RESET_TIME, latestResetBoundary } from '../../domain/dailyReset'
import { fromLocalDate, nextLocalDate, toLocalDate, toLocalMonth } from '../../domain/localTime'
import { formatTitleLead } from '../../domain/pageTitle'
import type { Board, BoardItem, CategoryId, Goal, PGPage, Phase, RepeatRule, Task, Weekday } from '../../domain/types'
import { MOCK_BOARD_ITEMS, MOCK_BOARDS } from './boards'

/*
 * Mock PG Page that reproduces specs/mockups/pg-page-desktop-v1.png.
 * Times are relative to `now` so the now indicator always lands mid-timeline.
 * Durations mirror the mockup's bar widths rather than realistic task lengths,
 * scaled into the default 08:00–22:00 day (LP-3.5). Pre-reading starts at 07:30
 * so the timeline shows auto-extend (LP-3.6) out of the box.
 */

const goals: Goal[] = [
  { id: 'day-clean-room', title: 'Clean your room', scope: 'day', completed: false },
  { id: 'day-read', title: 'Read 20 pages', scope: 'day', completed: true },
  { id: 'day-run', title: 'Go for a run', scope: 'day', completed: false },
  { id: 'day-call', title: 'Call grandma', scope: 'day', completed: false },
  { id: 'day-meal-prep', title: 'Meal prep', scope: 'day', completed: false },
  { id: 'month-f101', title: 'Pass F101', scope: 'month', completed: false },
  { id: 'month-fs', title: 'Ship FS project', scope: 'month', completed: false },
  { id: 'month-gym', title: 'Gym 12 times', scope: 'month', completed: true },
  { id: 'month-books', title: 'Finish two books', scope: 'month', completed: false },
  { id: 'month-save', title: 'Save $200', scope: 'month', completed: false },
]

export function createMockPage(
  now: Date = new Date(),
  timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
): PGPage {
  const today = startOfDay(new TZDate(now, timeZone))
  /** ISO string for `hours` (may be fractional) on the day `dayOffset` from today. */
  const at = (dayOffset: number, hours: number): string =>
    new Date(addDays(today, dayOffset).getTime() + hours * 3600_000).toISOString()

  const phase = (id: string, title: string, start: string, end: string, subphases?: Phase[]): Phase =>
    subphases ? { id, title, start, end, subphases } : { id, title, start, end }

  const tasks: Task[] = [
    ...[-1, 0, 1].map(
      (offset): Task => ({
        id: `make-bed-${offset + 1}`,
        categoryId: 'self-care',
        title: 'Make the bed',
        start: at(offset, 8.25),
        end: at(offset, 21.75),
        timeZone,
        completed: offset <= 0,
        goalId: 'day-clean-room',
        seriesId: 'make-the-bed',
      }),
    ),
    {
      id: 'f101-assignment',
      categoryId: 'productivity',
      title: 'F101 Assignment',
      start: at(-3, 9),
      end: at(3, 17),
      timeZone,
      completed: false,
      goalId: 'month-f101',
      phases: [phase('f101-work', 'Work on assignment', at(-3, 9), at(3, 17))],
    },
    {
      id: 'weekly-fs-project',
      categoryId: 'productivity',
      title: 'Weekly FS Project',
      start: at(-2, 9),
      end: at(4, 17),
      timeZone,
      completed: false,
      goalId: 'month-fs',
      phases: [phase('fs-sprint', 'Sprint', at(-2, 9), at(4, 17))],
    },
    {
      // Placeholder duplicate from the mockup; it has no special meaning.
      id: 'f101-assignment-2',
      categoryId: 'productivity',
      title: 'F101 Assignment',
      start: at(-2, 9),
      end: at(0, 21.75),
      timeZone,
      completed: false,
      goalId: 'month-f101',
      phases: [
        phase('f101b-research', 'Research', at(-2, 9), at(-1, 10.5), [
          phase('f101b-sources', 'Find sources', at(-2, 9), at(-1, 8)),
          phase('f101b-notes', 'Take notes', at(-1, 8), at(-1, 10.5)),
        ]),
        phase('f101b-draft', 'Draft', at(-1, 10.5), at(0, 18.5)),
        phase('f101b-review', 'Review', at(0, 18.5), at(0, 21.75)),
      ],
    },
    {
      id: 'pre-reading',
      categoryId: 'productivity',
      title: 'Pre-reading',
      start: at(0, 7.5),
      end: at(0, 16),
      timeZone,
      completed: true,
      goalId: 'day-read',
    },
    // LP-3.11a: kept off the time sheet; listed behind the All Day button.
    {
      id: 'grandma-birthday',
      categoryId: 'leisure',
      title: "Grandma's birthday",
      social: true,
      timing: 'all-day',
      start: at(0, 0),
      end: at(1, 0),
      timeZone,
      completed: false,
      goalId: 'day-call',
    },
    {
      id: 'pay-rent',
      categoryId: 'productivity',
      title: 'Pay rent',
      timing: 'untimed',
      start: at(0, 0),
      end: at(1, 0),
      timeZone,
      completed: true,
      goalId: 'month-save',
    },
    {
      id: 'library-books',
      categoryId: 'leisure',
      title: 'Return library books',
      timing: 'untimed',
      start: at(1, 0),
      end: at(2, 0),
      timeZone,
      completed: false,
      goalId: 'month-books',
    },
  ]

  const boardTasks = boardItemsToTasks(Object.values(MOCK_BOARD_ITEMS), today, timeZone)
  const theme: Goal = {
    id: 'theme-discipline',
    title: 'Discipline',
    scope: 'theme',
    completed: false,
    month: toLocalMonth(now.toISOString(), timeZone),
  }

  return {
    id: 'jakes-first-pg-page',
    ownerName: 'Jake',
    name: formatTitleLead('Jake'),
    version: 1,
    timeZone,
    resetTime: DEFAULT_RESET_TIME,
    // The fixture's checked items were ticked after today's reset already ran.
    lastResetAt: latestResetBoundary(now, DEFAULT_RESET_TIME, timeZone).toISOString(),
    goals: [...goals, theme],
    tasks: [...tasks, ...boardTasks],
    boards: pageBoards(),
  }
}

/* ---------- Folders (TW-OQ-1: boards list the page's tasks) ---------- */

/** The timeline's tasks, filed into an "Unsorted" folder of their category. */
const TIMELINE_FOLDERS: Record<CategoryId, string[]> = {
  productivity: ['f101-assignment', 'weekly-fs-project', 'f101-assignment-2', 'pre-reading', 'pay-rent'],
  'self-care': ['make-the-bed'],
  leisure: ['grandma-birthday', 'library-books'],
}

/** The mock boards, with the timeline's tasks added to each category's "Unsorted" folder. */
function pageBoards(): Board[] {
  return MOCK_BOARDS.map((board) => {
    const extra = TIMELINE_FOLDERS[board.categoryId] ?? []
    const unsorted = board.groups.find((g) => g.title === UNSORTED_TITLE)
    const groups = unsorted
      ? board.groups.map((g) => (g === unsorted ? { ...g, itemIds: [...g.itemIds, ...extra] } : g))
      : [...board.groups, { id: `${board.id}-unsorted`, title: UNSORTED_TITLE, layout: 'expanded' as const, itemIds: extra }]
    return { ...board, groups }
  })
}

/** How far around today weekday-repeating board items are generated. */
const BOARD_REPEAT_DAYS = { before: 14, after: 28 }

function repeatRuleFor(days: Weekday[]): RepeatRule {
  return days.length === 7
    ? { preset: 'daily', every: 1, unit: 'day', ends: { type: 'never' } }
    : { preset: 'custom', every: 1, unit: 'week', weekdays: [...days], ends: { type: 'never' } }
}

/**
 * Board fixture items as tasks. Weekday-repeating items become a series of
 * Not-timed occurrences; dated items become Not-timed tasks on those days;
 * items with a span keep it (and their phase strip) but stay off the
 * schedule; the rest are Not-timed and off the schedule.
 */
export function boardItemsToTasks(items: readonly BoardItem[], today: Date, timeZone: string): Task[] {
  const utc = (d: Date) => new Date(d.getTime()).toISOString()
  const dayAt = (d: Date) => ({ start: utc(d), end: utc(addDays(d, 1)) })
  const todayKey = toLocalDate(utc(today), timeZone)
  return items.flatMap((item): Task[] => {
    const categoryId = item.categoryIds.find((c) => c !== SOCIAL_CATEGORY) ?? item.categoryIds[0]
    const base = {
      title: item.title,
      categoryId,
      timeZone,
      ...(item.categoryIds.includes(SOCIAL_CATEGORY) ? { social: true } : {}),
      ...(item.status === 'inactive' ? { inactive: true } : {}),
    }
    const done = item.status === 'done'

    if (item.span) {
      return [{ ...base, id: item.id, ...item.span, phases: item.phases, completed: done, unscheduled: true }]
    }
    const repeatsOn = item.schedule?.repeatsOn
    if (repeatsOn?.length) {
      const repeat = repeatRuleFor(repeatsOn)
      const days: Date[] = []
      for (let n = -BOARD_REPEAT_DAYS.before; n <= BOARD_REPEAT_DAYS.after; n++) {
        const d = addDays(today, n)
        if (repeatsOn.includes(d.getDay() as Weekday)) days.push(d)
      }
      return days.map((d, i) => {
        const key = toLocalDate(utc(d), timeZone)
        return {
          ...base,
          id: i === 0 ? item.id : `${item.id}@${key}`,
          seriesId: item.id,
          timing: 'untimed',
          ...dayAt(d),
          repeat,
          completed: done && key === todayKey,
        }
      })
    }
    const dates = item.schedule?.instances ?? []
    if (dates.length) {
      return dates.map((date, i) => {
        const start = fromLocalDate(date, timeZone)
        const end = fromLocalDate(nextLocalDate(date), timeZone)
        if (!start || !end) throw new Error(`Bad fixture date "${date}"`)
        return {
          ...base,
          id: i === 0 ? item.id : `${item.id}@${date}`,
          ...(dates.length > 1 ? { seriesId: item.id } : {}),
          timing: 'untimed',
          start: start.toISOString(),
          end: end.toISOString(),
          completed: done,
        }
      })
    }
    return [{ ...base, id: item.id, timing: 'untimed', ...dayAt(today), completed: done, unscheduled: true }]
  })
}
