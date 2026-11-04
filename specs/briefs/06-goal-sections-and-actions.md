# Brief 06: Goal Sections and Day Actions

## Goal
Build the three chip sections and the action row (Select Task(s), Reset Day, Check All), wired to the store.

## Read first
- [00-README.md](00-README.md) (OQ-3)
- [02-domain-and-mock-data.md](02-domain-and-mock-data.md) (`checkAll` and `resetDay` semantics)
- [03-ui-primitives.md](03-ui-primitives.md)
- [Mockup](../mockups/pg-page-desktop-v1.png)

## Components (`src/features/pg-page/`)

### `GoalSection`
- Props: `title`, `scope: GoalScope`, `addLabel`.
- Uses the `SectionHeading` primitive, then a **4-column grid** of `Chip`s followed by one `AddChip`. It wraps onto new rows exactly as in the mockup, and the "+" always sits after the last chip.
- Reads only its own scope's goals through the scope selector from brief 02.
- Clicking a chip calls `toggleGoal`, which flips it between rust and green.
- `AddChip` is a **PLACEHOLDER(06)**. Accessible names: "Add day goal", "Add month goal", "Add theme or value".
- Render the grid as a `<ul>` of `<li>`s so screen readers announce the count.

### `GoalSections`
The three sections in order:
1. "Goals for the day" (`day`)
2. "Goals for the month" (`month`)
3. "Themes and Values for the month" (`theme`)

### `DayActions` (the action row)
- Layout per the mockup: "Select Task(s)" sits centered under the timeline panel. "Reset Day" sits at the right, with "Check All" below it.
- **Reset Day** calls `resetDay(today)` and **Check All** calls `checkAll(today)`. Both act on the timeline *and* the day-goal chips. "Today" means the actual current date, **not** the day scrolled into view. Flag this in the PR if it feels wrong in use.
- **Select Task(s)** is a **PLACEHOLDER(06), OQ-3**.
- After either action, announce the result through a polite live region, for example "All of today's tasks and day goals marked complete".

## Out of scope
- Adding, editing, or deleting goals.
- Confirmation dialogs for Reset Day. Note in the PR whether one seems needed.

## Files owned
`src/features/pg-page/GoalSection.tsx`, `GoalSections.tsx`, `DayActions.tsx`.

## Acceptance criteria
- [ ] With mock data, all three sections match the mockup's grid, spacing, and wrapping at 1440px.
- [ ] Toggling a chip changes its color and `aria-pressed` and does not re-render the other sections. Verify with Profiler.
- [ ] Check All turns every day-goal chip and today's timeline bars green. Reset Day reverses it. Month goals and themes don't change.
- [ ] RTL tests cover chip toggling, Check All, and Reset Day across both the chips and the timeline (render `PGPageView`).
- [ ] Tokens only.
