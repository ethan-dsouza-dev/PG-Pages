# Brief 03: UI Primitives

## Goal
Build the small set of design-system components in `src/ui/` that every feature reuses. They have no domain knowledge: props in, events out.

## Read first
- [00-README.md](00-README.md)
- [01-tokens-and-scaffold.md](01-tokens-and-scaffold.md) (token names)
- [Mockup](../mockups/pg-page-desktop-v1.png)

## Components

| Component | Mockup reference | Props (minimum) | Notes |
|---|---|---|---|
| `TextLink` | "Export to Sheets", "Reset Day", "Yesterday" | `size: 'nav' \| 'meta'`, `onClick` or `href`, `placeholder?: boolean` | Underlined body font. Render a `<button>` when given `onClick` and an `<a>` when given `href`. `placeholder` adds `aria-disabled="true"` plus a "Coming soon" `title`, and logs once via `console.info`. |
| `Chip` | "Clean your room" pills | `label`, `completed`, `onToggle` | Rust when to-do, green when done (`goal-*` tokens). Full-width inside its grid cell. Use `<button aria-pressed={completed}>`. Text is centered and white. |
| `AddChip` | tan "+" pills | `label` (accessible name, e.g. "Add day goal"), `onClick`, `size?: 'chip' \| 'compact'` | Tan fill with a strong ink border. The visible text is "+". `compact` is the smaller "Add Timed Task" button. |
| `Panel` | grey timeline card | `children`, `className?` | `surface-panel` with `radius-panel`. |
| `SectionHeading` | "Goals for the day" | `children`, `as?: 'h2' \| 'h3'` | `text-section` in the body font. |

Add a tiny `cx(...classes)` helper in `src/ui/cx.ts` instead of adding `clsx` as a new dependency.

## States every interactive primitive must have
- **Hover:** a subtle brightness or overlay change, defined once as a token or utility and not per component.
- **Focus-visible:** `focus-ring` outline with an offset, visible on yellow, rust, green, and grey.
- **Disabled/placeholder:** reduced emphasis, still focusable, announces "coming soon".
- **Motion:** color transitions ≤150ms, disabled under `prefers-reduced-motion`.

## Out of scope
- Storybook. A plain dev-only route or page (`/?primitives`) that renders every primitive in every state is enough, and doubles as a visual check.
- Icons. The "+" is text.

## Files owned
`src/ui/*`, plus the dev-only primitives preview.

## Acceptance criteria
- [ ] Each primitive has a React Testing Library test covering its role and accessible name, plus `aria-pressed` toggling for `Chip`.
- [ ] No raw colors or px values. Grep `src/ui` for `#` and `px`; the only hits should be in comments.
- [ ] The primitives preview visually matches the mockup's chips, add buttons, links, and panel at 1440px.
- [ ] Full keyboard operation: Tab to focus, Enter or Space to activate.
