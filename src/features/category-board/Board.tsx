import type { CSSProperties } from 'react'
import type { Board as BoardData, BoardItem, Category, CategoryId } from '../../domain/types'
import { AddChip } from '../../ui'
import { BoardGroup, type BoardScope } from './BoardGroup'
import { BOARD, boardColumns, laneLines } from './layout'
import { OverlapLane } from './OverlapLane'

export type BoardProps = {
  board: BoardData
  categories: Readonly<Record<CategoryId, Category>>
  items: Readonly<Record<string, BoardItem>>
  onToggleItem: (itemId: string) => void
  /** Id for the board's `<h2>`, so the enclosing section can be labelled by it. */
  headingId: string
}

/**
 * A category board: an outer ring around a pale inner panel holding the title
 * row, the groups, and the add-group bar, with one translucent band per overlap
 * lane. Entirely driven by `board` and its category's theme (09a): no variant
 * gets its own component or CSS.
 */
export function Board({ board, categories, items, onToggleItem, headingId }: BoardProps) {
  const category = categories[board.categoryId]
  const laneCount = board.overlapCategoryIds.length
  const laneNames = Object.fromEntries(
    board.overlapCategoryIds.map((id) => [id, categories[id]?.name ?? id]),
  )
  const scope: BoardScope = {
    board,
    boardName: category.name,
    laneNames,
    items,
    onToggleItem,
  }

  return (
    <div data-board-theme={category.theme} className="@container">
      <div
        className="relative grid gap-x-(--board-column-gap) gap-y-(--board-gap) rounded-(--board-radius) border-(length:--board-ring-width) border-board-ring bg-board-panel bg-clip-padding p-(--board-pad)"
        style={
          {
            gridTemplateColumns: boardColumns(laneCount),
            '--board-column-gap': `${BOARD.columnGapCqi}cqi`,
            '--board-row-gap': `${BOARD.rowGapCqi}cqi`,
          } as CSSProperties
        }
      >
        {board.overlapCategoryIds.map((id, i) => (
          <OverlapLane key={id} index={i} laneCount={laneCount} />
        ))}

        <h2
          id={headingId}
          className="relative z-2 col-[edge-start/primary-end] row-start-1 self-end pl-(--board-pad) font-display text-section font-bold"
        >
          {category.name}
        </h2>
        {board.overlapCategoryIds.map((id, i) => {
          const lines = laneLines(i)
          return (
            <p
              key={id}
              aria-hidden="true"
              className="relative z-2 row-start-1 self-end font-body text-label font-medium"
              style={{ gridColumn: `${lines.itemStart} / ${lines.end}` }}
            >
              {laneNames[id]}
            </p>
          )
        })}

        {board.groups.map((group) => (
          <BoardGroup key={group.id} group={group} scope={scope} />
        ))}

        <div className="col-span-full">
          {/* PLACEHOLDER(09): adding groups is out of scope. */}
          <AddChip label={`Add group to ${category.name}`} size="bar" placeholder />
        </div>
      </div>
    </div>
  )
}
