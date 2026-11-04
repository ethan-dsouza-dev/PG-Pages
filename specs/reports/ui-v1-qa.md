# PG Page UI v1: QA Report (Brief 07)

**Branch:** `feat/ui-tokens-primitives` · **Date:** 2026-11-04 · **Scope:** briefs 01–06, static UI with mock data, desktop only.

## Summary

| Gate | Result |
|---|---|
| `npm run build` | Pass (JS 110 kB gzip, CSS 4.5 kB gzip) |
| `npm run lint` | Pass |
| `npm run test` | Pass: 55 tests across 11 files |
| Lighthouse desktop (`vite preview`) | Performance **100**, Accessibility **96**, Best practices **100** (LCP 0.5 s, TBT 40 ms, CLS 0) |
| axe-core (dev server, page and open phase dialog) | 1 serious issue: `color-contrast` on done chips (see below) |
| Raw hex outside `tokens.css` | None |
| Primitive (`--palette-*`) use outside `tokens.css` | None |

## Fixed during QA

| Issue | Fix |
|---|---|
| The timeline rendered nothing until `ResizeObserver` first fired, which never happens in a background tab or a hidden pane | `useElementSize` now measures the element as soon as it's attached, then keeps observing |
| "Goals for the day" sat below "Check All" instead of level with it, as in the mockup | Pulled the goal sections up (`-mt-20`) |
| "Select Task(s)" wrapped onto two lines at 1024px | `whitespace-nowrap` |
| The primitives preview used `max-w-[1370px]` | Uses the `max-w-page` token |

## Visual deviations from the mockup (1440px)

| Area | Deviation | Status |
|---|---|---|
| Fonts | System UI font in place of the design fonts | Intentional until OQ-5 |
| Now line | It overshoots the track by about 20px. In the mockup it reaches up to the day links. | Intentional (keeps the SVG self-contained). Revisit if it matters. |
| Timeline content | Bars come from mock data relative to the real date, so their positions shift with the time of day | Intentional |
| Phase markers | Green tick, white tick, and white end cap are not drawn | Waiting on OQ-1 |
| Day goal chips | Mockup indents the first section's chips about 16px. Ours align with every section. | Intentional (the indent looks accidental) |
| Chip labels | Mock goals use varied titles instead of "Clean your room" ×11 | Intentional (makes selection bugs visible) |
| Phase detail | A centered dialog instead of a popover anchored to the strip | Intentional placeholder (OQ-2) |
| Token values | Colors and sizes were eyeballed from the PNG | Waiting on OQ-8 (Figma) |

**At 1024px:** nothing overlaps. The header links wrap and the timeline narrows. Mobile is out of scope.

## Accessibility

**Keyboard:** everything works by keyboard, with no positive `tabindex`. The tab order is: version link, then page links, then week links, then day links, then the timeline scroller (arrow keys change day), then task bars and phases in row order, then Add Timed Task, then Select / Reset / Check All, then day chips, month chips, and themes. The phase dialog traps focus, closes on Escape, and returns focus to the phase that opened it.

**Reduced motion:** smooth scrolling and color transitions are turned off under `prefers-reduced-motion`. Verified in code; not tested with an OS setting.

### Contrast findings (need a design decision; not changed)

| Pair | Ratio | Requirement | Result |
|---|---|---|---|
| White text on rust `#B4532A` (to-do chips and bars) | 4.99 | 4.5 (AA text) | Pass |
| White text on green `#3DAE2B` (done chips and bars) | **2.88** | 4.5 | **Fail** |
| White focus ring on green | **2.88** | 3.0 (non-text) | **Fail** (the ring is visible but faint) |
| White text on tan `#B08058` (the "+" glyph) | 3.46 | 3.0 (graphic) | Pass |
| Ink on yellow page or grey panel | 12.4 / 13.4 | 4.5 | Pass |

**Proposed primitive changes** (each is one line in `tokens.css`; the design owner decides):
- **`--palette-green-500`:** change to `#2B7F1D` (5.05:1 with white). Alternatively, keep the bright green as the fill and switch done-state text to ink (`#111111`).
- **Done state shown by color only (WCAG 1.4.1):** consider a check glyph or a strikethrough on done chips and bars. Screen readers already get `aria-pressed` and "done" or "to do" in the label.

## Design-system findings

- **Runtime retheming:** semantic tokens are declared with `@theme inline`, so compiled utilities point straight at primitives (`.bg-surface-page { background-color: var(--palette-yellow-500) }`).
  - Changing a **primitive** at runtime rethemes the page. Verified by swapping the yellow and green primitives live.
  - Changing a **semantic** token at runtime has **no effect**.
  - If per-page themes become a feature (OQ-6), either remap primitives per page or drop `inline` so utilities reference `--color-*`.
- **Timeline geometry:** the timeline's sizes are tier-3 tokens in `src/features/timeline/layout.ts`, because SVG coordinates need numbers, not CSS variables.

## Placeholders (`PLACEHOLDER(`)

```
src/features/pg-page/DayActions.tsx    PLACEHOLDER(06)  Select Task(s) (OQ-3)
src/features/pg-page/GoalSection.tsx   PLACEHOLDER(06)  "+" add-goal chips
src/features/pg-page/PageHeader.tsx    PLACEHOLDER(04)  visit other versions
src/features/pg-page/PageLinks.tsx     PLACEHOLDER(04)  Export ×3, New PG Page, Other PG Pages
src/features/timeline/PhaseDetail.tsx  PLACEHOLDER(05)  expanded phase view (OQ-2)
src/features/timeline/TimelineNav.tsx  PLACEHOLDER(05)  Last / This / Next week (OQ-4)
src/features/timeline/TimelinePanel.tsx PLACEHOLDER(05) Add Timed Task
```

## Open-question hooks (`TODO(OQ-`)

| OQ | Location | Status |
|---|---|---|
| OQ-1 phase markers | `features/timeline/TaskRow.tsx` | Open: next meeting |
| OQ-5 fonts | `styles/tokens.css` | Open: two families needed (display, body) |
| OQ-7 Task vs Event model | `domain/types.ts` | Open: architectural sign-off before persistence |
| OQ-8 exact token values | `styles/tokens.css`, `features/timeline/layout.ts` | Open: needs Figma |
| OQ-2, OQ-3, OQ-4 | See placeholders above | Open |
| OQ-6 theme / dark mode | See design-system findings | Open |

**Untagged TODO:** `TimelinePanel.tsx`. The three-day window is fixed when the page loads and doesn't roll over at midnight.

## Dependency notes (outside the PROJECT_BRIEF stack, or flagged)

- **`@testing-library/user-event`** (dev): realistic interaction tests.
- **`@date-fns/tz`**: time-zone-aware day boundaries. Plain date-fns only uses the system zone.
- **`axe-core`** (dev): accessibility scans during QA. It isn't imported by the app.
- **`typescript-eslint`**: bumped from 8.14 to 8.72, because 8.14 crashed under ESLint 10.

## Recommended next briefs

1. **Contrast and done-state fix:** apply the chosen green, or switch done text to ink, and add a non-color done indicator.
2. **Fonts:** wire in the OQ-5 fonts. Prefer self-hosted fonts to keep Lighthouse at 100.
3. **Midnight rollover:** re-anchor the timeline window when the date changes.
4. **Persistence (milestone 2):** resolve OQ-7, then add the Dexie storage layer behind the existing store API.
5. **Mobile layout:** once desktop is signed off.
