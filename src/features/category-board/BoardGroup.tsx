import { useId, type CSSProperties } from 'react'
import { COMPACT_LANE_CAP, COMPACT_PRIMARY_CAP, placeItems, visibleSlice } from '../../domain/boards'
import type { Board, BoardGroup as BoardGroupData, BoardItem, CategoryId } from '../../domain/types'
import { cx, SeeAllButton } from '../../ui'
import { BoardChip } from './BoardChip'
import { groupItemRows, laneLines, primaryCell } from './layout'

/** What every group in one board shares. */
export type BoardScope = {
  board: Board
  /** The board's category name, e.g. "Productivity". */
  boardName: string
  /** Display name per overlap lane, e.g. { social: "Social" }. */
  laneNames: Record<CategoryId, string>
  items: Readonly<Record<string, BoardItem>>
  onToggleItem: (itemId: string) => void
}

type BoardGroupProps = {
  group: BoardGroupData
  scope: BoardScope
  /** 0 for a top-level group; each nesting level adds one. */
  depth?: number
  /** Grid row this group occupies in its parent. */
  row?: number
}

const HEADING_TAGS = ['h3', 'h4', 'h5', 'h6'] as const

/**
 * One group: a ring around a pale panel spanning the whole board, the title in
 * primary cell 1, a 2-column primary area, one column per lane, then nested
 * groups. It is a column `subgrid` of the board, so lanes line up across groups.
 */
export function BoardGroup({ group, scope, depth = 0, row }: BoardGroupProps) {
  const headingId = useId()
  const { board, boardName, laneNames, items, onToggleItem } = scope
  const compact = group.layout === 'compact'
  const placed = placeItems(board, group, items)
  const primary = visibleSlice(placed.primary, compact ? COMPACT_PRIMARY_CAP : undefined)
  const lanes = board.overlapCategoryIds.map((id) => ({
    id,
    ...visibleSlice(placed.lanes[id], compact ? COMPACT_LANE_CAP : undefined),
  }))
  const itemRows = groupItemRows(
    primary.visible.length,
    lanes.map((l) => l.visible.length),
  )
  const isEmpty = primary.total === 0 && lanes.every((l) => l.total === 0)
  const Heading = HEADING_TAGS[Math.min(depth, HEADING_TAGS.length - 1)]
  const hasLanes = lanes.length > 0
  const rowsStyle: CSSProperties = { gridRow: `1 / span ${itemRows}` }

  return (
    <div
      role="group"
      aria-labelledby={headingId}
      data-board-group={group.id}
      className={cx(
        'col-span-full grid grid-cols-subgrid content-start gap-y-(--board-row-gap) rounded-(--group-radius) border-(length:--group-ring-width) border-group-ring bg-group-panel bg-clip-padding py-(--group-pad-block)',
        depth > 0 && 'mx-(--group-nest-inset)',
        isEmpty && 'min-h-(--group-empty-min-height)',
      )}
      style={row === undefined ? undefined : { gridRow: row }}
    >
      <div className="relative z-2 col-start-[primary-start] row-start-1 flex min-w-0 flex-col justify-center self-center">
        {group.note && <p className="text-caption">{group.note}</p>}
        <Heading id={headingId} className="font-body text-group font-medium break-words">
          {group.title}
        </Heading>
      </div>

      {isEmpty && <p className="sr-only">No items</p>}

      {primary.total > 0 && (
        <div
          role="group"
          aria-label={hasLanes ? `${boardName} only` : boardName}
          className="col-[primary-start/primary-end] grid grid-cols-subgrid grid-rows-subgrid"
          style={rowsStyle}
        >
          {primary.visible.map((item, i) => {
            const cell = primaryCell(i)
            return (
              <BoardChip
                key={item.id}
                item={item}
                onToggle={onToggleItem}
                className="self-center"
                style={{ gridColumn: cell.column, gridRow: cell.row }}
              />
            )
          })}
          {primary.hiddenCount > 0 && (
            <SeeAllButton
              count={primary.total}
              label={`See all ${primary.total} ${boardName} items in ${group.title}`}
              className="relative z-2 col-start-3 row-start-1 self-start"
            />
          )}
        </div>
      )}

      {lanes.map((lane, laneIndex) => {
        if (lane.total === 0) return null
        const lines = laneLines(laneIndex)
        const name = `${boardName} and ${laneNames[lane.id]}`
        return (
          <div
            key={lane.id}
            role="group"
            aria-label={name}
            className="grid grid-cols-subgrid grid-rows-subgrid"
            style={{ ...rowsStyle, gridColumn: `${lines.itemStart} / ${lines.seeEnd}` }}
          >
            {lane.visible.map((item, i) => (
              <BoardChip
                key={item.id}
                item={item}
                onToggle={onToggleItem}
                className="col-start-1 self-center"
                style={{ gridRow: i + 1 }}
              />
            ))}
            {lane.hiddenCount > 0 && (
              <SeeAllButton
                count={lane.total}
                label={`See all ${lane.total} ${name} items in ${group.title}`}
                className="relative z-2 col-start-2 row-start-1 self-start"
              />
            )}
          </div>
        )
      })}

      {group.children?.map((child, i) => (
        <BoardGroup key={child.id} group={child} scope={scope} depth={depth + 1} row={itemRows + 1 + i} />
      ))}
    </div>
  )
}
