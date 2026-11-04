import { laneBandColumn } from './layout'

type OverlapLaneProps = {
  index: number
  laneCount: number
}

/**
 * The translucent band behind one overlap lane. It is absolutely positioned on
 * the board's grid lines, so it lines up with the lane column in every group,
 * and runs from inside the top ring down into the bottom ring. It sits above
 * group panels and rings (the overlaps darken on their own) but below chips,
 * and ignores the pointer. Decorative: the area labels carry the meaning.
 */
export function OverlapLane({ index, laneCount }: OverlapLaneProps) {
  const isLast = index === laneCount - 1
  return (
    <div
      aria-hidden="true"
      data-overlap-lane=""
      className="pointer-events-none absolute z-1 rounded-(--lane-radius) bg-board-lane"
      style={{
        gridColumn: laneBandColumn(index, laneCount),
        top: 'calc(var(--board-ring-width) * -0.5)',
        bottom: 'calc(var(--board-ring-width) * -0.75)',
        left: 0,
        right: isLast ? 'calc(var(--board-ring-width) * -0.75)' : 0,
      }}
    />
  )
}
