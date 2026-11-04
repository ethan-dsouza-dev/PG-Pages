/*
 * Tier-3 (component) tokens for the gallery wall: the salon hang as data.
 *
 * Every value is relative to the wall's content box (`max-w-page`), which is a
 * size container, so the whole hang scales with the page width:
 *   - `*Fr` values are fractions of the wall's width.
 *   - `*Cqi` values are percentages of the wall's width (CSS `cqi`).
 * Tuned against specs/mockups/ad-gallery-desktop-v1.png at 1440px
 * (wall = 1370px, so 1cqi ≈ 13.7px). TODO(OQ-8): exact values from Figma.
 */

export type WallSlot = {
  /** The slot's column width. A frame fills it unless the height cap stops it first. */
  widthFr: number
  /** Space between this slot and the next one (after the last slot: the right margin). */
  gapAfterFr: number
  /** Distance from the wall's top edge to the frame's vertical center, in cqi. */
  centerY: number
}

export const WALL = {
  /** Height of the grey wall between the teal bands (576px at 1440). */
  heightCqi: 42,
  /**
   * Tallest a frame may be, border included (376px at 1440, the mockup's frames).
   * Narrow pictures in wide slots are capped by this and centered in their slot,
   * so a portrait ad dropped into the landscape slot never outgrows the wall.
   */
  frameMaxHeightCqi: 27.4,
  /** Left margin before the first slot, for a full hang. */
  leadFr: 0.0218,
  /** Gap between frames when fewer ads than slots are centered on the wall. */
  partialGapFr: 0.03,
  /**
   * Left to right, as in the mockup: a wide landscape piece hung mid-height,
   * a portrait piece hung close beside it and lowest, then a portrait piece
   * with more air around it, hung highest.
   */
  slots: [
    { widthFr: 0.344, gapAfterFr: 0.0168, centerY: 23.3 },
    { widthFr: 0.2197, gapAfterFr: 0.1056, centerY: 25.4 },
    { widthFr: 0.2314, gapAfterFr: 0.0607, centerY: 20.8 },
  ] satisfies WallSlot[],
} as const

const pct = (fr: number) => `${+(fr * 100).toFixed(2)}%`

export type WallHang = {
  /** `grid-template-columns` for the wall. */
  columns: string
  /** `justify-content` for the wall's grid. */
  justify: 'start' | 'center'
  /** One entry per frame actually hung, in order. */
  placements: { slot: WallSlot; column: number }[]
}

/**
 * Lays `count` frames onto the wall. A full set uses the mockup's uneven
 * spacing; a partial set (pool too small) uses the first slots' widths and
 * heights, evenly spaced and centered. Extra frames beyond the slots are dropped.
 */
export function hangFrames(count: number): WallHang {
  const slots: readonly WallSlot[] = WALL.slots
  const n = Math.max(0, Math.min(count, slots.length))

  if (n === slots.length) {
    const columns = [pct(WALL.leadFr), ...slots.flatMap((s) => [pct(s.widthFr), pct(s.gapAfterFr)])]
    return {
      columns: columns.join(' '),
      justify: 'start',
      placements: slots.map((slot, i) => ({ slot, column: 2 + 2 * i })),
    }
  }

  const used = slots.slice(0, n)
  return {
    columns: used.map((s) => pct(s.widthFr)).join(` ${pct(WALL.partialGapFr)} `),
    justify: 'center',
    placements: used.map((slot, i) => ({ slot, column: 1 + 2 * i })),
  }
}

/**
 * CSS width of a frame holding a picture of the given aspect ratio: as wide as
 * its slot, but no wider than the width at which it reaches the height cap.
 */
export function frameWidth(aspectRatio: number): string {
  const border = 'var(--frame-border)'
  const capped = `calc((${WALL.frameMaxHeightCqi}cqi - 2 * ${border}) * ${+aspectRatio.toFixed(4)} + 2 * ${border})`
  return `min(100%, ${capped})`
}
