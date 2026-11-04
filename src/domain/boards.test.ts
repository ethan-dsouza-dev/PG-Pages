import { describe, expect, it } from 'vitest'
import {
  COMPACT_LANE_CAP,
  COMPACT_PRIMARY_CAP,
  placeItems,
  toggleBoardItem,
  visibleSlice,
} from './boards'
import type { Board, BoardGroup, BoardItem } from './types'

const item = (id: string, categoryIds: string[], status: BoardItem['status'] = 'todo'): BoardItem => ({
  id,
  title: id,
  status,
  categoryIds,
})

const items: Record<string, BoardItem> = Object.fromEntries(
  [
    item('a', ['work']),
    item('b', ['work', 'social']),
    item('c', ['work', 'health']),
    item('d', ['work', 'health', 'social']),
    item('e', ['work']),
    item('stray', ['leisure']),
    item('off', ['work'], 'inactive'),
  ].map((i) => [i.id, i]),
)

const board = (overlapCategoryIds: string[]): Board => ({
  id: 'board',
  categoryId: 'work',
  overlapCategoryIds,
  groups: [],
})

const group = (itemIds: string[]): BoardGroup => ({ id: 'g', title: 'G', layout: 'compact', itemIds })

const ids = (list: BoardItem[]) => list.map((i) => i.id)

describe('placeItems', () => {
  it('puts items in the primary area or their lane, keeping display order', () => {
    const placed = placeItems(board(['social']), group(['b', 'a', 'd', 'e', 'c']), items)
    expect(ids(placed.primary)).toEqual(['a', 'e', 'c'])
    expect(ids(placed.lanes.social)).toEqual(['b', 'd'])
  })

  it('uses the first matching lane in board order (OQ-17)', () => {
    const socialFirst = placeItems(board(['social', 'health']), group(['b', 'c', 'd']), items)
    expect(ids(socialFirst.lanes.social)).toEqual(['b', 'd'])
    expect(ids(socialFirst.lanes.health)).toEqual(['c'])

    const healthFirst = placeItems(board(['health', 'social']), group(['b', 'c', 'd']), items)
    expect(ids(healthFirst.lanes.health)).toEqual(['c', 'd'])
    expect(ids(healthFirst.lanes.social)).toEqual(['b'])
  })

  it('puts everything in primary when the board has no lanes', () => {
    const placed = placeItems(board([]), group(['a', 'b', 'd']), items)
    expect(ids(placed.primary)).toEqual(['a', 'b', 'd'])
    expect(placed.lanes).toEqual({})
  })

  it('returns an empty array for every lane, even when nothing lands there', () => {
    const placed = placeItems(board(['social', 'health']), group([]), items)
    expect(placed).toEqual({ primary: [], lanes: { social: [], health: [] } })
  })

  it('throws on fixture errors in strict (dev) mode', () => {
    expect(() => placeItems(board([]), group(['a', 'stray']), items, { strict: true })).toThrow(
      /not in category "work"/,
    )
    expect(() => placeItems(board([]), group(['missing']), items, { strict: true })).toThrow(
      /unknown item "missing"/,
    )
  })

  it('skips fixture errors in non-strict (prod) mode', () => {
    const placed = placeItems(board([]), group(['a', 'stray', 'missing', 'e']), items, { strict: false })
    expect(ids(placed.primary)).toEqual(['a', 'e'])
  })
})

describe('visibleSlice', () => {
  const list = ['a', 'b', 'c', 'd', 'e']

  it('caps and counts what is hidden', () => {
    expect(visibleSlice(list, COMPACT_PRIMARY_CAP)).toEqual({
      visible: ['a', 'b', 'c'],
      hiddenCount: 2,
      total: 5,
    })
    expect(visibleSlice(list, COMPACT_LANE_CAP).hiddenCount).toBe(3)
  })

  it('shows everything under the cap or without one', () => {
    expect(visibleSlice(['a', 'b'], COMPACT_PRIMARY_CAP)).toEqual({ visible: ['a', 'b'], hiddenCount: 0, total: 2 })
    expect(visibleSlice(list)).toEqual({ visible: list, hiddenCount: 0, total: 5 })
    expect(visibleSlice([], 3)).toEqual({ visible: [], hiddenCount: 0, total: 0 })
  })

  it('treats a negative cap as zero', () => {
    expect(visibleSlice(list, -1)).toEqual({ visible: [], hiddenCount: 5, total: 5 })
  })
})

describe('toggleBoardItem', () => {
  it('flips todo and done', () => {
    const once = toggleBoardItem(items, 'a')
    expect(once.a.status).toBe('done')
    expect(toggleBoardItem(once, 'a').a.status).toBe('todo')
    expect(once.b).toBe(items.b)
  })

  it('leaves inactive and unknown items alone', () => {
    expect(toggleBoardItem(items, 'off')).toBe(items)
    expect(toggleBoardItem(items, 'nope')).toBe(items)
  })
})
