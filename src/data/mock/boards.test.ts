import { describe, expect, it } from 'vitest'
import { placeItems } from '../../domain/boards'
import type { Board, BoardGroup } from '../../domain/types'
import { MOCK_BOARD_ITEMS, MOCK_BOARDS, MOCK_CATEGORIES } from './boards'

const allGroups = (groups: BoardGroup[]): BoardGroup[] => groups.flatMap((g) => [g, ...allGroups(g.children ?? [])])

const counts = (board: Board, groupId: string) => {
  const group = allGroups(board.groups).find((g) => g.id === groupId)!
  const placed = placeItems(board, group, MOCK_BOARD_ITEMS, { strict: true })
  return { primary: placed.primary.length, social: placed.lanes.social.length, placed }
}

const board = (id: string) => MOCK_BOARDS.find((b) => b.id === id)!

describe('MOCK_BOARDS', () => {
  it('has Productivity, Self-Care, and Leisure in that order, each with a Social lane', () => {
    expect(MOCK_BOARDS.map((b) => MOCK_CATEGORIES[b.categoryId].name)).toEqual(['Productivity', 'Self-Care', 'Leisure'])
    for (const b of MOCK_BOARDS) expect(b.overlapCategoryIds).toEqual(['social'])
  })

  it('places every item without fixture errors, and every item is used once', () => {
    const used = MOCK_BOARDS.flatMap((b) => allGroups(b.groups).flatMap((g) => g.itemIds))
    expect(new Set(used).size).toBe(used.length)
    expect(used.length).toBe(Object.keys(MOCK_BOARD_ITEMS).length)
    for (const b of MOCK_BOARDS) for (const g of allGroups(b.groups)) expect(() => placeItems(b, g, MOCK_BOARD_ITEMS, { strict: true })).not.toThrow()
  })

  it('backs the mockups’ "See all" counts with real items', () => {
    const prod = board('board-productivity')
    expect(counts(prod, 'g-low-day')).toMatchObject({ primary: 22, social: 134 })
    expect(counts(prod, 'g-tuesday')).toMatchObject({ primary: 0, social: 0 })
    expect(counts(prod, 'g-wednesday')).toMatchObject({ primary: 22, social: 22 })
    for (const id of ['board-self-care', 'board-leisure']) {
      const b = board(id)
      expect(counts(b, b.groups[0].id)).toMatchObject({ primary: 22, social: 134 })
      expect(counts(b, b.groups[1].id)).toMatchObject({ primary: 9, social: 6 })
    }
  })

  it('uses the mockups’ statuses in the Unsorted Social lanes', () => {
    const lane = (id: string) => counts(board(id), board(id).groups[1].id).placed.lanes.social
    const selfCare = lane('board-self-care')
    expect(selfCare[0]).toMatchObject({ title: 'Call Plumber', status: 'done' })
    expect(selfCare.slice(1).every((i) => i.status === 'inactive')).toBe(true)
    const leisure = lane('board-leisure')
    expect(leisure.slice(1).every((i) => i.status === 'todo')).toBe(true)
  })

  it('has the note, the empty group, and the nested group on Productivity', () => {
    const [low, tuesday, wednesday] = board('board-productivity').groups
    expect(low.note).toBeTruthy()
    expect(tuesday.itemIds).toEqual([])
    expect(wednesday.children?.[0].title).toBe('Wednesday Seminar')
  })
})
