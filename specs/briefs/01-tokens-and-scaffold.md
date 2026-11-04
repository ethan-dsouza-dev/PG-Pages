# Brief 01: Tokens and Scaffold

## Goal
Install Tailwind CSS v4, remove the Vite starter boilerplate, set up the folder layout, and define the **design tokens** that every later brief consumes.

## Read first
- [00-README.md](00-README.md) (ground rules, open questions OQ-5, OQ-6, OQ-8)
- [Mockup](../mockups/pg-page-desktop-v1.png)
- PROJECT_BRIEF §4 (stack) and §7 (layers)

## In scope
- Add `tailwindcss` and `@tailwindcss/vite` (Tailwind v4), and wire the plugin into `vite.config.ts`.
- Add `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, and `jsdom`, plus a `test` script. All of these are in the stack.
- Delete the starter content in `src/App.tsx`, `src/App.css`, `src/index.css`, and `src/assets/*`. Render an empty `<App />` on the page background.
- Create the folder layout from the README (empty folders get a `.gitkeep`).
- Create `src/styles/tokens.css` and `src/styles/global.css`, and import them once from `main.tsx`.

## Out of scope
- Prettier or extra lint configuration beyond what exists (separate change).
- shadcn/ui and Radix. They aren't needed until a dialog or popover is required (brief 05 may flag this).
- Dark mode and per-page themes (OQ-6).

## Token architecture
Use **three tiers**. Components may only reference tier 2 (semantic) or tier 3 (component) tokens.

1. **Primitives** live as plain CSS custom properties on `:root`, named for *what they are*. They don't generate utilities.
2. **Semantic** tokens are declared in `@theme inline`, named for *what they're for*, and reference the primitives. This tier generates Tailwind utilities (`bg-surface-page`, `text-on-accent`, and so on).
3. **Component** tokens are also declared in `@theme inline` and are only used where a component needs its own knob (for example the timeline row height).

Also reset Tailwind's defaults in `@theme`: `--color-*: initial;` and `--font-*: initial;`. This keeps `bg-red-500` and similar defaults from compiling, which enforces token-only usage.

### Primitive values (eyeballed from the PNG; refine under OQ-8)
| Primitive | Value | Seen on |
|---|---|---|
| `--palette-yellow-500` | `#E3D500` | page background |
| `--palette-grey-300` | `#D9D9D9` | timeline panel |
| `--palette-rose-200` | `#D6BDBC` | timeline track (yesterday/tomorrow) |
| `--palette-rose-300` | `#CFA9A8` | timeline track (today) |
| `--palette-rust-600` | `#B4532A` | to-do task bars, goal chips |
| `--palette-brown-900` | `#52221E` | phase strips |
| `--palette-green-500` | `#3DAE2B` | completed bars |
| `--palette-tan-400` | `#B08058` | add buttons ("+") |
| `--palette-red-600` | `#E00000` | now indicator |
| `--palette-ink-900` | `#111111` | text, add-chip border |
| `--palette-white` | `#FFFFFF` | text on bars and chips |

### Semantic tokens (minimum set)
```
--color-surface-page        → yellow-500
--color-surface-panel       → grey-300
--color-track-today         → rose-300
--color-track-adjacent      → rose-200
--color-task-todo           → rust-600
--color-task-done           → green-500
--color-task-done-outline   → yellow-500   (thin yellow outline on green bars in the mockup)
--color-phase               → brown-900
--color-now                 → red-600
--color-goal-todo           → rust-600
--color-goal-done           → green-500
--color-add                 → tan-400
--color-text                → ink-900
--color-text-on-accent      → white
--color-border-strong       → ink-900
--color-focus-ring          → ink-900 (must be visible against the yellow, rust, and grey surfaces)
```

### Typography (OQ-5: two families)
```
--font-display  → "<DISPLAY FONT>", system-ui, sans-serif   /* title only; light (300) + bold (700) */
--font-body     → "<BODY FONT>", system-ui, sans-serif      /* everything else */
```
Leave the family names as a clearly marked `TODO(OQ-5)` and fall back to `system-ui`. Define a type scale (`--text-*`) that matches the mockup at 1440px:

| Token | Approx size | Used for |
|---|---|---|
| `--text-title` | 64px / 1.05 | "Jake's First" / "PG Page" |
| `--text-section` | 28px | "Goals for the day" |
| `--text-nav` | 26px, underlined | export / page links, action row |
| `--text-label` | 20px | chip and task-bar text, date |
| `--text-meta` | 18px | "Version 1", day/week links |

### Radius and spacing
- `--radius-chip` ≈ 6px, `--radius-panel` ≈ 14px, `--radius-add` ≈ 8px.
- Use Tailwind's default spacing scale (`--spacing` base 0.25rem). Don't invent spacing tokens unless a value repeats and doesn't fit the scale.

### Component tokens (timeline; consumed in brief 05)
```
--timeline-row-height   ≈ 46px
--timeline-row-gap      ≈ 32px
--timeline-phase-height ≈ 18px
--timeline-now-width    ≈ 3px
```

## Files owned
`vite.config.ts`, `package.json`, `src/main.tsx`, `src/App.tsx`, `src/styles/*`, removal of `src/App.css`, `src/index.css`, `src/assets/*`.

## Acceptance criteria
- [ ] `npm run dev` shows an empty page with the yellow background, and the console has no errors.
- [ ] `npm run build`, `npm run lint`, and `npm run test` all pass (an empty test suite is fine, or add one smoke test).
- [ ] Using a default Tailwind color such as `bg-red-500` produces **no** CSS. Verify by temporarily adding it, then remove it.
- [ ] Utilities like `bg-surface-page`, `bg-task-done`, `font-display`, and `text-title` work.
- [ ] `tokens.css` has a short header comment explaining the three tiers and the rule that components use semantic tokens only.
- [ ] No raw hex values outside the primitives block.
