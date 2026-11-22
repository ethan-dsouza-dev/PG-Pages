import type { CSSProperties } from 'react'
import type { BoardItem, CategoryId } from '../../domain/types'
import { cx } from '../../ui'
import { BoardChip } from './BoardChip'
import { bandRows, laneLines } from './layout'

type ItemBandProps = {
  /** Accessible name of the band, e.g. "On today's schedule". */
  label: string
  /** The board's category name, for the area labels. */
  boardName: string
  primary: readonly BoardItem[]
  /** One entry per overlap lane, in board order. */
  lanes: readonly { id: CategoryId; name: string; items: readonly BoardItem[] }[]
  /** Draw the black today outline (LP-7.8). */
  outlined?: boolean
  onToggleItem: (itemId: string) => void
}

/**
 * One block of items in an open folder: the 2-column primary area and one
 * column per lane, all shown, no "See all". A column subgrid of the board, so
 * the lane column stays under the lane band.
 */
export function ItemBand({ label, boardName, primary, lanes, outlined, onToggleItem }: ItemBandProps) {
  const rows = bandRows(
    primary.length,
    lanes.map((l) => l.items.length),
  )
  const rowsStyle: CSSProperties = { gridRow: `1 / span ${rows}` }
  const hasLanes = lanes.length > 0

  return (
    <div
      role="group"
      aria-label={label}
      data-today-band={outlined ? '' : undefined}
      className={cx(
        'col-span-full grid grid-cols-subgrid content-start gap-y-(--board-row-gap)',
        outlined &&
          'relative z-2 rounded-(--today-outline-radius) border-(length:--today-outline-width) border-today-outline py-(--group-pad-block)',
      )}
    >
      {primary.length > 0 && (
        <div
          role="group"
          aria-label={hasLanes ? `${boardName} only` : boardName}
          className="col-[primary-start/primary-end] grid grid-cols-subgrid grid-rows-subgrid"
          style={rowsStyle}
        >
          {primary.map((item, i) => (
            <BoardChip
              key={item.id}
              item={item}
              onToggle={onToggleItem}
              className="self-center"
              style={{ gridColumn: (i % 2) + 1, gridRow: Math.floor(i / 2) + 1 }}
            />
          ))}
        </div>
      )}
      {lanes.map((lane, laneIndex) => {
        if (lane.items.length === 0) return null
        const lines = laneLines(laneIndex)
        return (
          <div
            key={lane.id}
            role="group"
            aria-label={`${boardName} and ${lane.name}`}
            className="grid grid-cols-subgrid grid-rows-subgrid"
            style={{ ...rowsStyle, gridColumn: `${lines.itemStart} / ${lines.seeEnd}` }}
          >
            {lane.items.map((item, i) => (
              <BoardChip
                key={item.id}
                item={item}
                onToggle={onToggleItem}
                className="col-start-1 self-center"
                style={{ gridRow: i + 1 }}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}
