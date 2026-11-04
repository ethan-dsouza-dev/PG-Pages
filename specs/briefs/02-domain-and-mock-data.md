# Brief 02: Domain Types, Mock Data, and Store

## Goal
Define the UI-phase domain types, the pure time-math helpers for the timeline, the mock fixtures that reproduce the mockup, and a Zustand store holding completion state. That store is what makes ticking off, Reset Day, and Check All work.

## Read first
- [00-README.md](00-README.md) (glossary, OQ-7)
- PROJECT_BRIEF §6 (Event model) and §7 (time math lives in `domain/`)

## In scope
- Add `zustand`, `date-fns`, and `d3-scale` (+ `@types/d3-scale`). All are in the stack.
- Types in `src/domain/types.ts`.
- Time math in `src/domain/timeline.ts`, with tests.
- Day-action logic in `src/domain/dayActions.ts`, with tests.
- Fixtures in `src/data/mock/pgPage.ts`.
- Store in `src/store/pgPageStore.ts`.

## Out of scope
- Persistence (Dexie), sync, IDs from a server.
- Reconciling with the PROJECT_BRIEF `Event` type (OQ-7). Keep the types separate and add a comment pointing at OQ-7.

## Types (starting point; adjust if needed and explain why in the PR)
```ts
type GoalScope = 'day' | 'month' | 'theme';

type Goal = {
  id: string;
  title: string;
  scope: GoalScope;
  completed: boolean;
};

type Phase = {
  id: string;
  title: string;
  start: string;          // ISO 8601
  end: string;            // ISO 8601
  subphases?: Phase[];    // recursive
};

type Task = {
  id: string;
  title: string;
  start: string;          // ISO 8601
  end: string;            // ISO 8601
  timeZone: string;       // IANA
  completed: boolean;
  goalId?: string;        // tasks relate to a Goal
  seriesId?: string;      // instances of a repeating task share one timeline row
  phases?: Phase[];       // rendered as the dark strip; absent → no strip
};

type PGPage = {
  id: string;
  ownerName: string;      // "Jake"
  title: string;          // "Jake's First PG Page"
  version: number;        // 1
  goals: Goal[];
  tasks: Task[];
};
```

## Time math (`domain/timeline.ts`)
Pure functions only, with no React. The timeline window is **yesterday 00:00 → tomorrow 24:00** in the page's time zone (72h).
- `getTimelineWindow(now: Date): { start: Date; end: Date; days: [Date, Date, Date] }`
- `createTimeScale(window, widthPx)`: a `d3-scale` `scaleTime` mapping time to x.
- `clampToWindow(task, window)`: the visible start and end, plus flags `startsBefore` and `endsAfter`. Bars that run off the window are drawn flush to the edge, like F101 in the mockup.
- `groupTasksIntoRows(tasks)`: tasks that share a `seriesId` go in one row. Every other task gets its own row, in fixture order.
- Use `date-fns` for all day boundaries. Don't hand-roll time math.

**Tests** (`timeline.test.ts`) must cover: window boundaries, a task fully inside the window, a task spanning all three days, a task entirely outside the window, and a DST-transition day (for example by using `America/New_York` around a DST change date).

## Day actions (`domain/dayActions.ts`)
Pure reducers over `PGPage`:
- `toggleGoal(page, goalId)` and `toggleTask(page, taskId)`
- `checkAll(page, day)` marks every **day-scope goal** and every task overlapping `day` as completed.
- `resetDay(page, day)` does the inverse: uncompletes the same set.

These act on both the timeline and the chips (confirmed). Month goals and themes are **not** affected by day actions. Flag in the PR if that assumption feels wrong.

**Tests** (`dayActions.test.ts`) cover each reducer, including that month and theme goals are left untouched.

## Mock data (`data/mock/pgPage.ts`)
Build the fixtures **relative to the real current date** so the now indicator always lands somewhere meaningful. Reproduce the mockup:

| Task | Span | Completed | Phases |
|---|---|---|---|
| Make the bed (daily, 3 instances sharing `seriesId`) | one block each on yesterday, today, and tomorrow, in a single row | yesterday: yes, today: yes, tomorrow: no | none |
| F101 Assignment | yesterday → tomorrow (runs off both edges) | no | 1 phase spanning the whole task |
| Weekly FS Project | yesterday → tomorrow | no | 1 phase |
| F101 Assignment (2nd placeholder) | yesterday → late today | no | 2–3 phases, one with sub-phases |
| Pre-reading | today morning → today early afternoon | yes | none |

Goals: 5 day goals, 5 month goals, and 1 theme, all titled "Clean your room" as in the mockup. Vary the titles slightly ("Clean your room", "Read 20 pages", and so on) so selection bugs are visible, and mark 1–2 of them as completed. Link at least two tasks to goals via `goalId`.

## Store (`store/pgPageStore.ts`)
- Holds the `PGPage`. Exposes `toggleGoal`, `toggleTask`, `checkAll`, and `resetDay`, each delegating to the pure reducers.
- Exposes a selector hook per section so chips and timeline rows only re-render when their own slice changes (PROJECT_BRIEF §8).

## Acceptance criteria
- [ ] All new domain functions are covered by tests, and `npm run test` passes.
- [ ] No `any`, and no React imports in `domain/`.
- [ ] Mock data type-checks against the types and matches the table above.
- [ ] `// TODO(OQ-7)` comment on the `Task` type.
