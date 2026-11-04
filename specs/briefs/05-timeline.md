# Brief 05: Timeline Visualization

## Goal
Build the horizontally scrollable **yesterday / today / tomorrow** timeline in SVG. It shows task bars (to-do or done), clickable phase strips, and a live now indicator. This is the core of the product, so it gets the most care.

## Read first
- [00-README.md](00-README.md) (OQ-1, OQ-2, OQ-4)
- [02-domain-and-mock-data.md](02-domain-and-mock-data.md) (time math, row grouping)
- PROJECT_BRIEF §8 (visualization requirements)
- [Mockup](../mockups/pg-page-desktop-v1.png)

## Structure (`src/features/timeline/`)
```
TimelinePanel        Panel wrapper: date label above, week links, day labels, scroller, Add Timed Task
 ├─ WeekNav          Last week / This week / Next week (PLACEHOLDER(05), OQ-4)
 ├─ DayNav           "Yesterday" / "Tomorrow" links that scroll the viewport
 ├─ TimelineScroller Horizontal scroll container with scroll-snap per day
 │   └─ TimelineSvg  Pure: (rows, window, width, height) → <svg>
 │       ├─ DayTracks      3 background rects (today vs adjacent token colors)
 │       ├─ TaskRow × n    bar + optional PhaseStrip
 │       │   ├─ TaskBar    rect + centered label; click toggles completion
 │       │   └─ PhaseStrip segments per phase; click opens PhaseDetail
 │       └─ NowIndicator   isolated, ticking component (see below)
 └─ PhaseDetail      expanded-phase placeholder (OQ-2)
```

## Behavior

### Scrolling between days
- The SVG content is **3 day-widths wide**, and each day is as wide as the visible scroller. Scroll-snap aligns to day boundaries.
- On mount, the scroller sits on **today**.
- The mockup shows slivers of yesterday and tomorrow beside today. Get that with `scroll-padding` or a slightly narrower day width, so a hint of each neighbor stays visible. Pick whichever is simpler and note it in the PR.
- Clicking "Yesterday" or "Tomorrow" smooth-scrolls to that day (instant under `prefers-reduced-motion`). The left and right arrow keys do the same when the scroller is focused.
- The date label above the panel ("October 10th 2026") shows the day currently snapped into view. Format it with `date-fns` (`MMMM do yyyy`).

### Task bars
- Position and width come **only** from `domain/timeline.ts` (`createTimeScale` and `clampToWindow`). No time math in components.
- Fill uses `task-todo` or `task-done`. Done bars have the thin `task-done-outline` stroke seen in the mockup.
- The label is centered on the **visible** part of the bar, in white body font. Truncate with an ellipsis via `<title>` or clip-path if the bar is too narrow.
- Clicking a bar or pressing Enter/Space on it calls `toggleTask`. Each bar is a focusable element with `role="button"`, `aria-pressed`, and an `aria-label` like "F101 Assignment, 9:00 AM yesterday to 5:00 PM tomorrow, to do".
- Bars that run off the window edge are drawn flush to the edge with square corners on the clipped side.

### Phase strips
- A dark strip directly under its task bar, spanning each phase's range. Draw adjacent phases as separate segments with a 1px gap so they're individually clickable.
- Clicking a segment or pressing Enter on it opens `PhaseDetail` for that phase.
- **`TODO(OQ-1)`:** the green tick, white tick, and white end cap markers are **not** implemented. Leave the TODO at the render site with a link to the README's open questions.

### PhaseDetail (placeholder for OQ-2)
- A Radix Dialog or Popover (`@radix-ui/react-dialog` or `-popover`; Radix is in the stack) anchored to the strip.
- Show the phase title, its time range, and a nested list of sub-phases (recursive). Add a visible "Design pending" note.
- Dismiss with Escape or a click outside. Focus returns to the strip segment.

### Now indicator
- A red vertical line (`--color-now`, `--timeline-now-width`) that extends slightly above and below the track, as in the mockup.
- **Isolated:** `NowIndicator` owns its own `useNow(intervalMs = 60_000)` hook. The minute tick must **not** re-render `TimelineSvg` or the rows. Verify this with React Profiler and include a screenshot in the PR.
- `aria-hidden`. Expose the current time through a visually hidden live region instead, updated at most once a minute.

### Add Timed Task
- `AddChip size="compact"` with the visible label "Add Timed Task", bottom-right of the panel. **PLACEHOLDER(05).**

## Performance
- Memoize `TimelineSvg` and `TaskRow` (the React Compiler is on, so confirm it handles them, or add `memo`).
- `TimelineSvg` uses a `viewBox`. Its width comes from a `ResizeObserver` on the scroller, through a small `useElementSize` hook.

## Out of scope
- Drag to reschedule, creating tasks, and week view.
- OQ-1 markers and the final phase-detail design.

## Files owned
`src/features/timeline/**`, `src/ui/useElementSize.ts` (if added).

## Acceptance criteria
- [ ] At 1440px with mock data, the timeline matches the mockup: row order, bar colors, phase strips, and the now line. Note deviations in the PR.
- [ ] It opens on today. The Yesterday and Tomorrow links and the arrow keys snap between days.
- [ ] Toggling a bar flips its color, and Check All / Reset Day (brief 06) are reflected here.
- [ ] Clicking a phase opens the placeholder detail with nested sub-phases from mock data.
- [ ] Profiler shows only `NowIndicator` re-rendering on the minute tick.
- [ ] Component tests cover: a bar's accessible name and toggle, opening the phase detail, and the day nav scroll call (mock `scrollTo`).
- [ ] Tokens only, with no time math in `features/`.
