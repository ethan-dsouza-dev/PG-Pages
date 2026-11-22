import { describe, expect, it } from 'vitest'
import type { Board, BoardGroup } from '../../domain/types'
import { CATEGORY, isLeaf, parentPath, resolveFolderPath, ROOT } from './folderPath'

const g = (id: string, children?: BoardGroup[]): BoardGroup => ({
  id,
  title: id,
  layout: 'compact',
  itemIds: [],
  children,
})

const board: Board = {
  id: 'b',
  categoryId: 'work',
  overlapCategoryIds: [],
  groups: [g('a'), g('b', [g('b1', [g('b1x')])])],
}

describe('resolveFolderPath', () => {
  it('is null for the root view and the trail of groups otherwise', () => {
    expect(resolveFolderPath(board, ROOT)).toBeNull()
    expect(resolveFolderPath(board, CATEGORY)).toEqual([])
    expect(resolveFolderPath(board, ['b', 'b1', 'b1x'])?.map((x) => x.id)).toEqual(['b', 'b1', 'b1x'])
  })

  it('is null when a step does not exist at that level', () => {
    expect(resolveFolderPath(board, ['b1'])).toBeNull()
    expect(resolveFolderPath(board, ['a', 'b1'])).toBeNull()
  })
})

describe('parentPath', () => {
  it('goes up one level and stops at the root', () => {
    expect(parentPath(['b', 'b1'])).toEqual(['b'])
    expect(parentPath(['b'])).toEqual(CATEGORY)
    expect(parentPath(CATEGORY)).toBe(ROOT)
    expect(parentPath(ROOT)).toBe(ROOT)
  })
})

describe('isLeaf', () => {
  it('is true only without child folders', () => {
    expect(isLeaf(g('x'))).toBe(true)
    expect(isLeaf(g('x', []))).toBe(true)
    expect(isLeaf(board.groups[1])).toBe(false)
  })
})
