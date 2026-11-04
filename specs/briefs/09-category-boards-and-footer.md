# Brief 09: Category Boards and Page Footer

## Goal
Add the last sections of the page stack, below the ad gallery:

1. Three **category boards** stacked one after another: **Productivity** (red), **Self-Care** (teal), and **Leisure** (yellow). They're all the same component. A board groups a person's items for one life area into named **groups** ("Cleaning Day", "Unsorted", …). Items that also belong to a second category ("Social") sit in a shaded **overlap lane** on the right side of the board.
2. The red **page footer**, with a "Customize" link and the page name. With the footer in place, the page's scrollable content is complete.

The main job of this brief is to build **one** board component that is driven entirely by data and a theme. The three boards differ only in their config. [09a-category-board-variants.md](09a-category-board-variants.md) is the companion guide: it describes each variant in the mockups and how to configure it.

## Read first
- [00-README.md](00-README.md). The ground rules apply.
- [08-ad-gallery-section.md](08-ad-gallery-section.md), for how the page stack works. Boards join it the same way the gallery did.
- [09a-category-board-variants.md](09a-category-board-variants.md). Read it before you design the props and data types, because the types have to cover every variant it lists.
- Mockups:
  - [Productivity board](../mockups/board-productivity-v1.png). This one is a **work in progress**: it shows an empty group, a group with a note, and a nested group, but its bottom edge is cropped and the nested group spills outside its parent. Use it for structure, not for exact geometry.
  - [Self-Care board](../mockups/board-self-care-v1.png). This is the **reference for geometry** (spacing, ring thickness, lane position). Match it at 1440px.
  - [Leisure board and footer](../mockups/board-leisure-and-footer-v1.png). The second geometry reference, and the only mockup of the footer.

## Decisions already made
| Topic | Decision |
|---|---|
| What the "Social" column means | **Intersection.** An item that belongs to the board's category *and* to Social appears in the Social lane. A board can have zero or more overlap lanes. Every mockup shows exactly one. |
| What this brief covers | All three boards on the page, plus the footer. |
| Chip colors | Rust = to do. **Green with a yellow outline = done.** **Muted brown = inactive.** |
| Where items come from | A **new `BoardItem` type**. It's separate from the `Goal` and `Task` used at the top of the page. Reconciling them is OQ-7's job later, not this brief's. |

## Anatomy (described from the Self-Care mockup at 1440px)
Use these terms in the code and in the PR.

```
Board ─ outer ring (theme hue, translucent)
 └ inner panel (pale tint of the hue)
    ├ header row:  Board title (large, left)            Lane label "Social" (at the lane's left edge)
    ├ Group ─ ring (theme hue, translucent) + inner panel
    │   ├ Group title (+ optional small note above it)
    │   ├ primary area: 2 item columns   + "See all" control
    │   ├ lane area:    1 item column per lane + "See all" control
    │   └ child Groups (nested, same component)
    ├ Group …
    └ Add-group bar ("+", full width, placeholder)
 Overlap lane ─ a vertical rounded band in the theme hue, translucent, drawn OVER
                everything from just above the first group to the board's bottom ring
```

**Layering is what makes the look.** The board ring, the group rings, and the lane are all the *same hue* at different alpha levels over white. Wherever two of them overlap, the color gets darker by itself: a group ring crossing the lane, a nested group inside its parent, the "+" bar under the lane. Build it this way and the darkening at intersections comes for free, with no extra tokens. Don't hand-pick a separate "ring under lane" color.

### Board
- Full-bleed `<section aria-labelledby>` like the other sections. The white page surface shows around the board. The board itself is a rounded card centered in `max-w-page`, not edge to edge.
- Two concentric rings (outer ring, then the inner panel), each about 2.5% of the board width, with large corner radii. Put the radius and ring thickness in component tokens.
- Title: display font, about the size of the PG Page section headings, bold. It sits top-left inside the inner panel.

### Group
- A rounded ring, thicker than the inner panel's padding, around a pale panel. It spans the full width of the board, *under* the lane.
- Title: body font, medium weight, a step smaller than the board title. It goes in **column 1, row 1** of the primary area. An optional `note` renders above it in a very small size (the Productivity mockup's "(essentially it's priority tasks)", see OQ-15).
- **Item grid:** the primary area has 2 equal columns and each lane has 1. They're filled **row-major**, and the title occupies cell (col 1, row 1). That gives the mockups' placement: in "Low Day Productivity", data order `[Weekly FS, Clean your room, F101]` lands Weekly FS top-right, Clean your room under the title, and F101 under Weekly FS.
- **Lane columns line up across every group in the board**, because the lane is one continuous band. Define the board's column template once and have groups (nested ones too) inherit it. CSS `subgrid` is the cleanest way and is fine for desktop-only. Using a shared CSS variable for `grid-template-columns` is also acceptable. Acceptance: the lane's item column has the same x-position (±1px) in every group.
- **Layout modes:**
  - `compact` shows at most **2 rows**: 3 items in the primary area, because the title takes a cell, and 2 items per lane. If an area has more items than it shows, a **"See all" control** sits to the right of that area's last column: a two-bar "=" icon, the words "See all", and the total count underneath, all in a tiny size. "See all" is a **placeholder** (`// PLACEHOLDER(09)`, see OQ-14).
  - `expanded` shows every item, with no "See all".
  - An **empty** group (no items in any area) keeps a minimum height (the Productivity mockup's "Tuesday School Day"). Don't render "See all", and include a visually-hidden "No items" message.
- **Nested groups** (the Productivity mockup's "Wednesday Seminar") render after the parent's item grid, inset by the parent's padding, using the same component recursively. Support **one level of nesting**, and have the type allow deeper nesting. Unlike the WIP mockup, a child must stay **inside** its parent.

### Overlap lane
- One lane per entry in `board.overlapCategoryIds`. Its label (the category name, body font, medium) sits in the board header row, aligned with the lane's item column.
- The band is a rounded rectangle (the same radius as the group rings). It spans the lane's columns, including the "See all" gutter, and runs from the header row down through the board's inner bottom edge, finishing *inside* the outer ring.
- Draw it as an absolutely positioned overlay with `pointer-events: none` so the chips under it stay clickable. Mark it `aria-hidden`. The structure is conveyed by the area headings described under Accessibility.
- **With zero lanes**, the primary area takes up the freed width (columns stay 2, each wider) and no band is drawn. This must look intentional.

### Items (`BoardChip`)
- These have the same size, radius, font, and colors as the existing goal `Chip`. Reuse the `--color-goal-*` and `--color-task-done-outline` tokens.
- **Status:**
  - `todo` is rust.
  - `done` is green with the yellow outline. **The outline stays yellow on the Leisure board too**, as the mockup shows.
  - `inactive` is muted brown (a new token, roughly rust desaturated toward the tan used by `AddChip`), and its label is slightly faded.
- Clicking toggles `todo` ↔ `done` through the store, the same way goal chips do. **Inactive** chips render as `aria-disabled="true"` buttons with "inactive" in their accessible name, and clicking does nothing (OQ-16).
- **Phase chips:** an item with `phases` renders as the title bar (top half) plus a dark **phase strip** (bottom half). That's the same look as a timeline task row, but it's HTML, not SVG, and it scales to the item's *own* span rather than to the timeline window.
  - Pull the math into a pure `phaseSegments(span, phases) → { id, startFr, endFr }[]` in `src/domain/` and test it.
  - Render the strip with a new `PhaseBar` UI primitive: segments separated by a 1px white gap, and a rounded right end.
  - The green, white, and red tick markers and the white end cap are **OQ-1**. Don't draw them. Leave a `TODO(OQ-1)` at the render site, the same as in the timeline.
  - In v1 the strip is **decorative** (`aria-hidden`). The chip's accessible name gets ", {n} phases" appended. Clicking anywhere on the chip toggles it.

### Add-group bar
- A full-width tan bar with a 1px dark border and a centered "+", at the bottom of every board. Reuse `AddChip` (add a `size="bar"` if needed). It's a **placeholder** labelled "Add group to {board}". Its right portion darkens under the lane through translucency, so don't special-case it.
- The Productivity mockup doesn't show this bar only because it's cropped. Every board gets one.

### Page footer
- A full-bleed band in a deep red (a new `--palette-red-800`, about `#b00000`) that ends the page. About 370px tall at 1440px. There's no white gap after it. It's the last thing on the page.
- Content is right-aligned inside `max-w-page`:
  - top right: **"Customize"**, a white underlined `TextLink`, display font, about the size of a board title. It's a **placeholder** (`// PLACEHOLDER(09)`).
  - bottom right: the **page name**, white, display font, bold, on two lines ("Jake's First" / "PG Page"). Build it from `usePageMeta()` exactly as the header does, so the two never disagree. Let it wrap naturally inside a narrow max width. Don't hard-code the line break.
- It's a `<footer>` (the `contentinfo` landmark), so it renders **outside** `<main>`: `PageStack` renders `<main>…</main><PageFooter />`, or `App` does. Pick one and say which in the PR.

## Data and domain
Add to `src/domain/types.ts`:

```ts
type CategoryId = string

type Category = {
  id: CategoryId
  name: string            // "Productivity", "Social"
  theme: BoardTheme       // which token set a board for this category uses
}

type BoardTheme = 'productivity' | 'self-care' | 'leisure'   // grows with new themes

type BoardItemStatus = 'todo' | 'done' | 'inactive'

type BoardItem = {
  id: string
  title: string
  status: BoardItemStatus
  /** Every category the item belongs to. Decides which lane it lands in. */
  categoryIds: CategoryId[]
  /** Optional phase strip. `span` is required when phases are present. */
  span?: TimeSpan
  phases?: Phase[]
}

type BoardGroup = {
  id: string
  title: string
  note?: string                       // OQ-15
  layout: 'compact' | 'expanded'
  itemIds: string[]                   // display order; lane placement is derived
  children?: BoardGroup[]
}

type Board = {
  id: string
  categoryId: CategoryId              // title and theme come from the category
  overlapCategoryIds: CategoryId[]    // one lane each, in this order
  groups: BoardGroup[]
}
```

**Lane placement is derived, not stored.** It lives in a pure `placeItems(board, group, itemsById)` in `src/domain/boards.ts`, which returns `{ primary: BoardItem[], lanes: Record<CategoryId, BoardItem[]> }`:
- If an item belongs to one or more of the board's overlap categories, it goes in the **first** matching lane in `overlapCategoryIds` order. Otherwise it goes in `primary`.
- If an item doesn't include the board's own category, that's a fixture error. Throw in dev, skip in prod, and test both.
- Apply the `compact` caps in a separate pure function, `visibleSlice(items, cap) → { visible, hiddenCount, total }`, so the counting is tested without the DOM. The caps are named constants (`COMPACT_PRIMARY_CAP = 3`, `COMPACT_LANE_CAP = 2`).

**Mock data** goes in `src/data/mock/boards.ts`. Rebuild the three mockups' content. Every item is its own entity, even when the titles repeat ("Clean your room" ×N is placeholder copy):
- Give "See all" counts real backing. A group that shows "See all 22" really has 22 items in that area. Generate the extra ones with a small helper in the fixture file, and don't hand-write them.
- Categories: `productivity`, `self-care`, `leisure`, `social`.
- Productivity board: Low Day Productivity (compact, with a note), Tuesday School Day (empty), Wednesday School Day (compact, containing Wednesday Seminar).
- Self-Care board: Cleaning Day (compact), Unsorted (expanded, with the Social lane mostly `inactive` and Call Plumber `done`).
- Leisure board: the same structure as Self-Care, but the Social lane in Unsorted is `todo`.

**Store:** add a boards slice exposing `useBoards()`, `useBoardItems()` (or a selector per board), `useCategory(id)`, and an action `toggleBoardItem(id)` that ignores `inactive` items. It follows the same patterns as the goals and ads slices.

## Components and files
- `src/ui/PhaseBar.tsx`: segments as fractions. It has no domain knowledge.
- `src/ui/SeeAllButton.tsx`: icon, label, and count. The placeholder behavior comes from `placeholder.ts`.
- `src/ui/AddChip.tsx`: add the `bar` size if needed.
- `src/features/category-board/`:
  - `CategoryBoardSection.tsx`: the full-bleed section, which sets the theme.
  - `Board.tsx`: rings, header, groups, lanes, and the add bar.
  - `BoardGroup.tsx`: recursive.
  - `BoardChip.tsx`
  - `OverlapLane.tsx`
  - `layout.ts`: the column template, caps, ring and lane geometry as data, the same way the timeline and gallery do it.
- `src/features/page-footer/PageFooter.tsx`
- `PAGE_SECTIONS` gets **one entry per board**, all using `CategoryBoardSection` with a `boardId`. The registry's type therefore needs to support props, or a small wrapper per board. Choose whichever keeps "append one entry" true for future sections.

## Theming (tokens)
In `tokens.css`, keep the three tiers. **A theme is a set of CSS custom properties scoped by `[data-board-theme="…"]`.** Components only ever reference the semantic board tokens, so adding a theme means adding one block of CSS and one entry in the `BoardTheme` union.

- **Primitives:** one hue per theme. The values below are eyeballed from the mockups and carry `TODO(OQ-8)`.

  | Theme | Hue | Inner panel |
  |---|---|---|
  | productivity | `#f44a4a` | `#fcd0d0` |
  | self-care | `#4fd6cf` | `#cdf1ef` |
  | leisure | `#ebe04f` | `#f7f2bd` |

  Also add `--palette-red-800` (`#b00000`, the footer) and `--palette-brown-500` (the inactive chip, about `#8f6440`).
- **Semantic, per theme block:** `--color-board-ring`, `--color-board-panel`, `--color-group-ring`, `--color-group-panel`, and `--color-board-lane`. The rings and the lane are the theme hue **at alpha**, for example via `color-mix(in srgb, var(--board-hue) 70%, transparent)`, so layering darkens on its own.
- **Global semantic:** `--color-surface-footer`, `--color-text-on-footer`, and `--color-board-item-inactive`.
- **Component tokens:** `--board-ring-width`, `--board-radius`, `--group-ring-width`, `--group-radius`, `--lane-radius`, and `--board-gap` (the space between groups).

## Accessibility
- Each board is a `<section>` labelled by its title (`<h2>`). Each group title is an `<h3>`, and a nested group's title is an `<h4>`.
- Inside a group, give each area a visually-hidden label so a screen reader hears the intersection that sighted users see as color: "Productivity only" for the primary area, and "Productivity and Social" for the lane. A `role="group"` with `aria-label` around each area's chips works.
- Tab order goes **row by row through each group: primary area, then its See all, then lane, then its See all**, then into child groups, then the add bar. That follows the DOM order, so don't use positive `tabindex`.
- Chips use `aria-pressed` for done. "See all" gets an accessible name like "See all 22 Productivity items in Low Day Productivity".
- Contrast: white text on the inactive chip still has to pass 4.5:1. If the faded label fails, fade the background instead and keep the text at full opacity.

## Out of scope
- What "See all", "Customize", and the add-group "+" actually do. They're placeholders.
- Creating, editing, reordering, or dragging items or groups. Adding or removing lanes from the UI.
- Phase interaction on board chips (the timeline's phase detail panel isn't reused here).
- Linking `BoardItem` to the top-of-page `Goal` or `Task` (OQ-7).
- Mobile (ground rule 2). At 1024px the chips may truncate with an ellipsis, but the lane must stay aligned and nothing may overlap.

## Files owned
- `src/features/category-board/*`, `src/features/page-footer/*`, `src/ui/PhaseBar.tsx`, `src/ui/SeeAllButton.tsx`, `src/domain/boards.ts` (+ test), `src/domain/phaseSegments.ts` (+ test), and `src/data/mock/boards.ts`.
- Edits allowed: `src/domain/types.ts`, the store (the boards slice), `PageStack.tsx` (section entries, footer placement), `App.tsx` (only if the footer goes there), `tokens.css`, `src/ui/AddChip.tsx` (the `bar` size), `src/ui/index.ts`, and `src/dev/PrimitivesPreview.tsx`.

## Acceptance criteria
- [ ] Scrolling past the gallery shows Productivity, Self-Care, and Leisure boards separated by the white section gap, then the red footer with nothing below it.
- [ ] The Self-Care and Leisure boards match their mockups at 1440px in a side-by-side check: ring thicknesses, radii, lane position and width, chip sizes, "See all" placement, and darker overlaps where rings cross the lane.
- [ ] The Productivity board shows the note, the empty group, and the nested group, and the nested group sits fully inside its parent.
- [ ] Every variant in [09a](09a-category-board-variants.md) has a fixture in the dev preview (`?boards`) and renders correctly, including **zero lanes** and **two lanes**, which aren't in the mockups.
- [ ] The lane item column lines up within ±1px across every group of a board, including nested groups.
- [ ] Toggling a chip flips todo ↔ done and persists for the session. Inactive chips don't toggle and say "inactive" to a screen reader.
- [ ] "See all" counts equal the real number of items in that area. Compact groups never show more than 3 primary or 2 lane items.
- [ ] Phase chips draw segments in proportion to `phaseSegments`, and there are no OQ-1 markers.
- [ ] Changing a board's category theme in the fixture (for example making Leisure use `self-care`) recolors the whole board with no component change.
- [ ] The footer shows "Customize" (placeholder) and the same page name as the header. There's exactly one `<main>` and one `<footer>`, and the footer is outside `<main>`.
- [ ] axe reports no serious or critical issues. Tab order matches the order described under Accessibility.
- [ ] The PG Page and ad gallery look identical to before (before and after screenshots).
- [ ] Unit tests cover `placeItems`, `visibleSlice`, and `phaseSegments`. RTL tests cover a compact group with overflow, an expanded group, an empty group, a nested group, the zero-lane board, the inactive chip, and the footer's page name.
- [ ] Tokens only (the hex grep is still clean). No new dependencies. `npm run build`, `npm run lint`, and `npm run test` pass.

## Open questions (add to 00-README)
| ID | Question | Status |
|---|---|---|
| OQ-14 | What does **See all** do? Expand the group in place, open a modal, or navigate? | Open. Placeholder. |
| OQ-15 | Is "(essentially it's priority tasks)" above "Low Day Productivity" UI copy (a group note) or a designer annotation? | Open. Supported as an optional `note`, used in one fixture. |
| OQ-16 | What makes an item **inactive** (snoozed? out of season? not relevant to this group?), and can the user toggle it? | Open. Rendered muted and non-toggleable. |
| OQ-17 | Can an item sit in **two** overlap lanes at once, for example Social and Health? | Open. It goes in the first matching lane, in board order. |
| OQ-18 | Which boards a page shows, and in what order: fixed (Productivity, Self-Care, Leisure) or user-chosen via **Customize**? | Open. Fixed order from the fixture. |
