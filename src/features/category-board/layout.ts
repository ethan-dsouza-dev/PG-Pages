/*
 * Tier-3 (component) tokens for category boards: the shared column template,
 * as data. Every length is in cqi of the board (the board's wrapper is a size
 * container), so the whole board scales with the page width. Ring widths,
 * radii, and the board/group padding are CSS tokens in tokens.css.
 * Tuned against specs/mockups/board-self-care-v1.png. TODO(OQ-8): exact values.
 *
 * The board's inner panel defines the columns once; every group (nested ones
 * too) is a `subgrid` of it, so each lane's item column sits at the same x in
 * every group and the lane band is one straight column.
 *
 *   edge | p1 | p2 | p-see | per lane: lead | item | see | edge
 *
 * `edge` holds a group's ring and inner padding (and, for a nested group, the
 * extra inset plus its own ring), so chips never sit under a ring.
 */

export const BOARD = {
  /** Room for a group's ring and padding on each side. Must cover one nesting level. */
  edgeCqi: 4.4,
  /** Gap between every pair of columns. */
  columnGapCqi: 1.8,
  /** Gap between item rows inside a group. */
  rowGapCqi: 1.1,
  /** The "See all" gutter right of an area's last column. */
  seeAllCqi: 2.8,
  /** Space between a lane band's left edge and its item column. */
  laneLeadCqi: 3.4,
} as const

const cqi = (n: number) => `${n}cqi`

/** Names of the grid lines a lane's tracks start and end on. */
export function laneLines(index: number) {
  const lane = `lane-${index}`
  return {
    start: `${lane}-start`,
    itemStart: `${lane}-item-start`,
    seeEnd: `${lane}-see-end`,
    end: `${lane}-end`,
  }
}

/** `grid-template-columns` for a board with `laneCount` overlap lanes. */
export function boardColumns(laneCount: number): string {
  const { edgeCqi, seeAllCqi, laneLeadCqi } = BOARD
  // Line names at one position must share one bracket group: "[a] [b]" is invalid CSS.
  let template = `[edge-start] ${cqi(edgeCqi)} [primary-start] minmax(0, 1fr) minmax(0, 1fr) ${cqi(seeAllCqi)} [primary-end`
  for (let i = 0; i < laneCount; i++) {
    const l = laneLines(i)
    template += ` ${l.start}] ${cqi(laneLeadCqi)} [${l.itemStart}] minmax(0, 1fr) ${cqi(seeAllCqi)} [${l.seeEnd} ${l.end}`
  }
  return `${template}] ${cqi(edgeCqi)} [edge-end]`
}

/**
 * Where a lane's band goes, as grid lines of the board's inner panel. The last
 * lane runs on through the right edge into the ring, as in the mockups.
 */
export function laneBandColumn(index: number, laneCount: number): string {
  const l = laneLines(index)
  return index === laneCount - 1 ? `${l.start} / auto` : `${l.start} / ${l.end}`
}

/** Item rows a group needs: the title takes primary cell 1, then 2 per row; 1 per row in a lane. */
export function groupItemRows(primaryVisible: number, laneVisible: readonly number[]): number {
  return Math.max(1, Math.ceil((primaryVisible + 1) / 2), ...laneVisible)
}

/** Row-major cell (1-based column and row in the 2-column primary area) for the k-th primary item. */
export function primaryCell(index: number): { column: number; row: number } {
  const cell = index + 1 // cell 0 is the title
  return { column: (cell % 2) + 1, row: Math.floor(cell / 2) + 1 }
}
