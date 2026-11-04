import type { Board, BoardGroup, BoardItem, CategoryId } from './types'

/** A compact group shows at most two rows: the title takes one primary cell, leaving 3. */
export const COMPACT_PRIMARY_CAP = 3
/** A compact group shows at most two rows of each lane's single column. */
export const COMPACT_LANE_CAP = 2

export type PlacedItems = {
  /** Items in the board's category only. */
  primary: BoardItem[]
  /** One entry per `board.overlapCategoryIds`, always present, possibly empty. */
  lanes: Record<CategoryId, BoardItem[]>
}

type PlaceOptions = {
  /** Throw on fixture errors instead of skipping the bad item. Defaults to dev builds. */
  strict?: boolean
}

/**
 * Splits a group's items into the primary area and the overlap lanes.
 * An item that belongs to one or more of the board's overlap categories goes in
 * the first matching lane, in `overlapCategoryIds` order (OQ-17); otherwise it
 * is primary. An unknown id, or an item outside the board's own category, is a
 * fixture error: thrown in dev, skipped in prod.
 */
export function placeItems(
  board: Board,
  group: BoardGroup,
  itemsById: Readonly<Record<string, BoardItem>>,
  { strict = import.meta.env.DEV }: PlaceOptions = {},
): PlacedItems {
  const lanes: Record<CategoryId, BoardItem[]> = Object.fromEntries(
    board.overlapCategoryIds.map((id) => [id, [] as BoardItem[]]),
  )
  const primary: BoardItem[] = []

  for (const id of group.itemIds) {
    const item = itemsById[id]
    const problem = !item
      ? `unknown item "${id}"`
      : !item.categoryIds.includes(board.categoryId)
        ? `item "${id}" is not in category "${board.categoryId}"`
        : null
    if (problem) {
      if (strict) throw new Error(`Board "${board.id}", group "${group.id}": ${problem}`)
      continue
    }

    const lane = board.overlapCategoryIds.find((c) => item.categoryIds.includes(c))
    if (lane === undefined) primary.push(item)
    else lanes[lane].push(item)
  }

  return { primary, lanes }
}

export type Slice<T> = {
  visible: T[]
  /** Items not shown because of the cap. */
  hiddenCount: number
  total: number
}

/** The first `cap` items. Omit `cap` (or pass Infinity) to show everything. */
export function visibleSlice<T>(items: readonly T[], cap: number = Infinity): Slice<T> {
  const visible = items.slice(0, Math.max(0, cap))
  return { visible, hiddenCount: items.length - visible.length, total: items.length }
}

/** Flips todo ↔ done. Inactive items (OQ-16) and unknown ids are left alone. */
export function toggleBoardItem(
  items: Readonly<Record<string, BoardItem>>,
  id: string,
): Record<string, BoardItem> {
  const item = items[id]
  if (!item || item.status === 'inactive') return items
  return { ...items, [id]: { ...item, status: item.status === 'done' ? 'todo' : 'done' } }
}
