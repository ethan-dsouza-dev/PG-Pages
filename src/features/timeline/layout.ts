/*
 * Tier-3 (component) tokens for the timeline. SVG geometry needs plain numbers,
 * so these live here instead of in tokens.css. Values in px at the 1440px
 * reference width, eyeballed from the mockup (TODO(OQ-8)).
 */
export const TIMELINE = {
  /** How far the now line overshoots the track above and below. */
  overshoot: 20,
  /** Space between the track's top/bottom edge and the first/last row. */
  trackPadY: 36,
  rowHeight: 46,
  rowGap: 28,
  /** Height of the phase strip; the bar above it shrinks by this much. */
  phaseHeight: 18,
  nowWidth: 3,
  barRadius: 4,
  /** Each day is this fraction of the viewport, leaving slivers of its neighbors visible. */
  dayWidthRatio: 0.65,
} as const

export function rowTop(rowIndex: number): number {
  return TIMELINE.overshoot + TIMELINE.trackPadY + rowIndex * (TIMELINE.rowHeight + TIMELINE.rowGap)
}

export function timelineHeight(rowCount: number): number {
  const rows = rowCount * TIMELINE.rowHeight + Math.max(0, rowCount - 1) * TIMELINE.rowGap
  return 2 * TIMELINE.overshoot + 2 * TIMELINE.trackPadY + rows
}

export type DayIndex = 0 | 1 | 2

export function clampDay(day: number): DayIndex {
  return Math.min(2, Math.max(0, day)) as DayIndex
}
