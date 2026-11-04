# PG Page UI: Agent Briefs

Briefs for building the first **PG Page (Personal Growth Page)** screen as a static React UI backed by a tokenized design system.

- **Mockup:** [../mockups/pg-page-desktop-v1.png](../mockups/pg-page-desktop-v1.png)
- **Project context:** [../PROJECT_BRIEF.md](../PROJECT_BRIEF.md). Read it before starting any brief.

## How to use these briefs

There is one implementing agent, and it works through the briefs **in order**. Each brief is meant to be one small, reviewable change (one PR or commit series). Don't start a brief until the previous brief's acceptance criteria pass.

| # | Brief | Depends on |
|---|---|---|
| 01 | [Tokens and scaffold](01-tokens-and-scaffold.md) | none |
| 02 | [Domain types, mock data, and store](02-domain-and-mock-data.md) | 01 |
| 03 | [UI primitives](03-ui-primitives.md) | 01 |
| 04 | [Page shell and header](04-page-shell-and-header.md) | 03 |
| 05 | [Timeline visualization](05-timeline.md) | 02, 03, 04 |
| 06 | [Goal sections and day actions](06-goal-sections-and-actions.md) | 02, 03, 04 |
| 07 | [Integration and QA pass](07-integration-qa.md) | all |

## Ground rules (apply to every brief)

1. **Static UI with mock data.** No Dexie, Supabase, auth, or network calls in this phase. All data comes from `src/data/mock/` through the Zustand store.
2. **Desktop web only.** Target a 1440px-wide viewport and stay usable down to 1024px. Mobile layouts are explicitly out of scope; don't spend effort on them.
3. **Tokens only.** Components never use raw hex values, raw px font sizes, or Tailwind's default palette. Every color, font, radius, and spacing value that is specific to this design comes from the tokens defined in brief 01.
4. **Placeholders stay placeholders.** These controls are rendered but do nothing beyond a `console.info` and an accessible "coming soon" affordance until user stories exist: export links, version links, New/Other PG Pages, week navigation, Add Timed Task, and the add-chip "+" buttons. Each one is marked with a `// PLACEHOLDER(<brief#>)` comment so it's easy to find later.
5. **Brief §13 still applies:** typed code with no `any`, pure components, tests alongside domain logic. Don't add dependencies outside the PROJECT_BRIEF stack without flagging them in the PR description.
6. **Folder layout** (from PROJECT_BRIEF §7):
   ```
   src/
     styles/        tokens.css, global.css
     ui/            design-system primitives (no domain knowledge)
     features/
       pg-page/     page shell, header, goal sections, action row
       timeline/    timeline visualization
     domain/        types, time math, pure logic (+ *.test.ts)
     data/mock/     mock fixtures
     store/         Zustand store(s)
   ```

## Glossary

| Term | Meaning |
|---|---|
| **PG Page** | Personal Growth Page. One planner page holding goals, themes, and timed tasks. |
| **Goal** | A day-goal, month-goal, or month theme/value, shown as a chip. Can be ticked off. A separate entity from tasks. |
| **Task** | A timed item on the timeline, with a start and end. It can belong to a Goal and can be ticked off. |
| **Phase** | A segment of a task's timeline, drawn as the dark strip under the task bar. Clickable, and can contain sub-phases. |
| **Now indicator** | The red vertical line marking the current time. |

## Open questions (tracked across briefs)

| ID | Question | Affects | Status |
|---|---|---|---|
| OQ-1 | What do the **green tick, white tick, and white end cap** on a phase strip mean? (See the second "F101 Assignment" row in the mockup.) | 05 | To decide at the next meeting. Don't implement. Leave a `TODO(OQ-1)` at the phase-strip render site. |
| OQ-2 | What does the **expanded phase view** look like, and how are sub-phases shown in it? | 05 | Open. Build a minimal placeholder panel (see brief 05). |
| OQ-3 | What does **Select Task(s)** do? (A multi-select mode? Which bulk actions?) | 06 | Open. Placeholder. |
| OQ-4 | What do **Last week / This week / Next week** do with a 3-day timeline? | 05 | Open. Placeholder. |
| OQ-5 | **Font families.** Two are needed: a *display* font (the title, light and bold weights) and a *body* font (everything else). | 01 | Waiting on the design owner. Use the fallbacks in brief 01 until then. |
| OQ-6 | Is the page yellow a fixed brand color or a per-page user theme? Is dark mode needed? | 01 | Assume fixed and light-only for now. Tokens must make a later switch a one-file change. |
| OQ-7 | How does the UI `Task` type relate to the PROJECT_BRIEF `Event` model (`source`, `recurrence`, sync fields)? | 02 | Architectural, so it needs sign-off before persistence work. For now, define UI types separately. |
| OQ-8 | Exact token values. Current values were eyeballed from a PNG export. Is there a Figma file to inspect? | 01 | Refine when Figma access is available. |
