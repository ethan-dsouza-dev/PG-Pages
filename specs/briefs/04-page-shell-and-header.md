# Brief 04: Page Shell and Header

## Goal
Build the page-level layout and the left header column, leaving clearly defined slots for the timeline (brief 05) and the goal sections (brief 06).

## Read first
- [00-README.md](00-README.md) (placeholder rule, desktop-only rule)
- [03-ui-primitives.md](03-ui-primitives.md)
- [Mockup](../mockups/pg-page-desktop-v1.png)

## Layout (desktop, 1440px reference)
```
┌───────────────────────── surface-page (yellow), full bleed ─────────────────────────┐
│  ┌ Header column (~30%) ┐  ┌ Timeline slot (~60%), date label above the panel ┐   │
│  │ Title                │  │                                                 │   │
│  │ Version / versions   │  │                <TimelineSlot/>                  │   │
│  │ (gap)                │  │                                                 │   │
│  │ Export links ×3      │  │                                                 │   │
│  │ New / Other PG Pages │  └─────────────────────────────────────────────────┘   │
│  └──────────────────────┘                                                        │
│                               Action row slot (aligned under the panel)          │
│  Goal sections slot (full width)                                                 │
└──────────────────────────────────────────────────────────────────────────────────┘
```
- Use CSS grid: two columns for the top band, then full-width rows. Content max width ≈ 1370px, centered.
- Below 1024px, don't optimize anything. The layout only needs to avoid breaking (no overlapping text).

## Components (`src/features/pg-page/`)
- `PGPageView`: the shell. It reads the page from the store and lays out the slots. It renders `<Timeline />` and `<GoalSections />` once those exist. Until then it renders labeled empty boxes.
- `PageHeader`:
  - The title is two lines in `font-display`: "Jake's First" (light) and "PG Page" (bold). Derive it from `page.ownerName`, adding the possessive "'s" and "First". Put the derivation logic in a pure function with a test. Render the title in a single `<h1>`.
  - "Version {n}" plus "visit other versions" (`TextLink`, placeholder).
- `PageLinks`: Export to Sheets, Export to Calendar, Export Additions to Calendar, New PG Page, and Other PG Pages. All are **placeholders** marked `// PLACEHOLDER(04)`. Wrap them in a `<nav aria-label="Page actions">`.

## Out of scope
- Routing between PG Pages or versions.
- Any export logic.

## Files owned
`src/features/pg-page/PGPageView.tsx`, `PageHeader.tsx`, `PageLinks.tsx`, `src/App.tsx`.

## Acceptance criteria
- [ ] At 1440px the header column matches the mockup's hierarchy and spacing. Compare side by side and note any deliberate deviations in the PR.
- [ ] The landmarks are correct: one `<main>`, one `<h1>`, and the nav has a label.
- [ ] All seven placeholder links are focusable, announce "coming soon", and do nothing else.
- [ ] Tokens only.
