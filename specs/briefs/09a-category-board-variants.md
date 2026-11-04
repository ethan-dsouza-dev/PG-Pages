# Brief 09a: Category Board Variants

Read this alongside [brief 09](09-category-boards-and-footer.md). The board component should be **configured, not forked**. Each variant below comes from config: theme, lanes, group layout, item status, nesting. None of them gets its own component or its own CSS file. If a variant seems to need a new component, stop and flag it in the PR instead.

## The variant axes

| Axis | Values | Controlled by | Seen in |
|---|---|---|---|
| **Theme** | `productivity` (red), `self-care` (teal), `leisure` (yellow) | `Category.theme` → `data-board-theme` | All three mockups |
| **Overlap lanes** | 0, 1, or 2+ | `Board.overlapCategoryIds` | 1 lane (Social) in every mockup. 0 and 2 have to work anyway. |
| **Group layout** | `compact`, `expanded` | `BoardGroup.layout` | compact: "Cleaning Day". expanded: "Unsorted" |
| **Group content** | items, empty, note, children | `itemIds`, `note`, `children` | empty: "Tuesday School Day". note: "Low Day Productivity". children: "Wednesday School Day" |
| **Item kind** | plain, phase | `BoardItem.phases` and `span` | plain: "Clean your room". phase: "Weekly FS Project" |
| **Item status** | `todo`, `done`, `inactive` | `BoardItem.status` | done: "Call Plumber". inactive: Self-Care's Unsorted Social lane |

The axes are **independent**: any theme works with any lane count, layout, and status. The `?boards` dev preview should show this with a matrix (see the bottom of this guide).

## Recipes for the use cases in the mockups

### 1. Productivity: a "day-type" board ([mockup](../mockups/board-productivity-v1.png))
A board whose groups are **kinds of days**. The user plans what belongs on a low day, a school day, and so on.

```ts
{ id: 'board-productivity', categoryId: 'productivity', overlapCategoryIds: ['social'], groups: [
  { id: 'g-low-day', title: 'Low Day Productivity', note: "(essentially it's priority tasks)",
    layout: 'compact', itemIds: ['weekly-fs', 'clean-room-1', 'f101', /* +19 more primary */ 'call-plumber', 'meet-design', /* +132 more social */] },
  { id: 'g-tuesday', title: 'Tuesday School Day', layout: 'compact', itemIds: [] },          // empty variant
  { id: 'g-wednesday', title: 'Wednesday School Day', layout: 'compact',
    itemIds: ['f101-wed', /* … */ 'meet-design-wed', /* … */],
    children: [{ id: 'g-wed-seminar', title: 'Wednesday Seminar', layout: 'compact', itemIds: [] }] },  // nested variant
]}
```
What it exercises: the note, the empty group's minimum height, nesting (the child keeps the parent's lane columns), and "See all" on both areas.

### 2. Self-Care: a "routine + backlog" board ([mockup](../mockups/board-self-care-v1.png))
One compact routine group ("Cleaning Day"), then an **expanded "Unsorted" backlog** that shows everything.

```ts
{ id: 'board-self-care', categoryId: 'self-care', overlapCategoryIds: ['social'], groups: [
  { id: 'g-cleaning', title: 'Cleaning Day', layout: 'compact', itemIds: [/* 22 primary, 134 social */] },
  { id: 'g-unsorted', title: 'Unsorted', layout: 'expanded', itemIds: [/* 10 primary, 6 social */] },
]}
```
What it exercises: expanded layout (no caps, no "See all"), row-major fill around the title cell, and a lane that's mostly **`inactive`** with one **`done`** item. This is the reference for geometry.

### 3. Leisure: the same shape, all active ([mockup](../mockups/board-leisure-and-footer-v1.png))
Structurally the same as Self-Care, but in the `leisure` theme and with the Social lane items as `todo`.
What it exercises: **theme swap only**. If getting Leisure right takes anything beyond a new token block and fixture data, the component isn't generic enough. Also check that the done chip's **yellow outline** is still visible against the yellow theme.

## Variants not in the mockups (must still work)

| Variant | Config | Expected result |
|---|---|---|
| **No lanes** | `overlapCategoryIds: []` | No band and no lane label. The primary area's 2 columns widen to fill the space. Group rings run the full width with no darker section. |
| **Two lanes** | `['social', 'health']` | Two bands side by side, each with its own label and "See all". The primary area narrows. An item in both categories goes in the first lane (OQ-17). |
| **Compact, under the cap** | 2 primary items, 1 lane item | No "See all" on either area. |
| **Only lane items** | Every item is also Social | The primary area holds just the title. The lane fills. |
| **Long titles** | A 60-character item or group title | The chip truncates with an ellipsis, and the full title is in `title` and the accessible name. Group titles wrap within column 1 and push the rows down instead of overlapping. |
| **Deep nesting** | A child with its own child | Renders (the type allows it). Visually it's only tuned for one level. |
| **Phase chip in a lane** | A phase item that's also Social | Same chip, inside the band. The strip still reads clearly against the darker background. |

## How to add a new variant later

**A new theme** (for example "Health", green):
1. In `tokens.css`, add `--palette-board-health-hue` and `--palette-board-health-panel`. Mark them `TODO(OQ-8)`.
2. Add a `[data-board-theme="health"]` block that maps them onto the five `--color-board-*` / `--color-group-*` semantic tokens. Copy an existing block and change only the two primitives.
3. Add `'health'` to the `BoardTheme` union.
4. Add a fixture board to the `?boards` matrix.

Components shouldn't change. If one has to, the theme leaked out of tokens.

**A new overlap category:** add a `Category`, then list its id in a board's `overlapCategoryIds`. Lane placement comes from `placeItems`.

**A new group layout** (for example a "timeline" group): this is the one change that *does* need code. Add the value to the `layout` union, branch in `BoardGroup` on the layout and nothing else, and keep the shared column template so the lane still lines up.

## Dev preview: `?boards`
A dev-only route that renders:
1. The three real boards from the page fixture.
2. A **matrix**: each theme × {0 lanes, 1 lane, 2 lanes}, with one compact and one expanded group per board. The groups use a fixed fixture that includes every item kind and status.
3. The edge cases from the "Variants not in the mockups" table, one small board each.

This is where a reviewer checks the variants, so name each board after its variant ("leisure · 2 lanes · expanded").
