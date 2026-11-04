import { TZDate } from '@date-fns/tz'
import { addDays, startOfDay } from 'date-fns'
import type { Goal, PGPage, Phase, Task } from '../../domain/types'

/*
 * Mock PG Page that reproduces specs/mockups/pg-page-desktop-v1.png.
 * Times are relative to `now` so the now indicator always lands mid-timeline.
 * Durations mirror the mockup's bar widths rather than realistic task lengths.
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
  { id: 'theme-discipline', title: 'Discipline', scope: 'theme', completed: false },
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
        title: 'Make the bed',
        start: at(offset, 0.5),
        end: at(offset, 23.5),
        timeZone,
        completed: offset <= 0,
        goalId: 'day-clean-room',
        seriesId: 'make-the-bed',
      }),
    ),
    {
      id: 'f101-assignment',
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
      title: 'F101 Assignment',
      start: at(-2, 9),
      end: at(0, 23.75),
      timeZone,
      completed: false,
      goalId: 'month-f101',
      phases: [
        phase('f101b-research', 'Research', at(-2, 9), at(-1, 4), [
          phase('f101b-sources', 'Find sources', at(-2, 9), at(-1, 0)),
          phase('f101b-notes', 'Take notes', at(-1, 0), at(-1, 4)),
        ]),
        phase('f101b-draft', 'Draft', at(-1, 4), at(0, 18)),
        phase('f101b-review', 'Review', at(0, 18), at(0, 23.75)),
      ],
    },
    {
      id: 'pre-reading',
      title: 'Pre-reading',
      start: at(0, 0.5),
      end: at(0, 14),
      timeZone,
      completed: true,
      goalId: 'day-read',
    },
  ]

  return {
    id: 'jakes-first-pg-page',
    ownerName: 'Jake',
    title: "Jake's First PG Page",
    version: 1,
    timeZone,
    goals,
    tasks,
  }
}
