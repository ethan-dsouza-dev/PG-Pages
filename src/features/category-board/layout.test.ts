import { describe, expect, it } from 'vitest'
import { boardColumns, groupItemRows, laneBandColumn, primaryCell } from './layout'

describe('boardColumns', () => {
  it.each([0, 1, 2])('builds a valid template for %i lanes', (lanes) => {
    const template = boardColumns(lanes)
    // Adjacent bracket groups ("[a] [b]") make the whole declaration invalid.
    expect(template).not.toMatch(/\]\s*\[/)
    expect(template.match(/minmax\(0, 1fr\)/g)).toHaveLength(2 + lanes)
    expect(template.startsWith('[edge-start]')).toBe(true)
    expect(template.endsWith('[edge-end]')).toBe(true)
    for (let i = 0; i < lanes; i++) expect(template).toContain(`lane-${i}-item-start`)
  })
})

describe('laneBandColumn', () => {
  it('runs the last lane through the right edge', () => {
    expect(laneBandColumn(0, 2)).toBe('lane-0-start / lane-0-end')
    expect(laneBandColumn(1, 2)).toBe('lane-1-start / auto')
  })
})

describe('primaryCell and groupItemRows', () => {
  it('fills row-major around the title cell', () => {
    // Data order [Weekly FS, Clean your room, F101]: top right, under the title, under Weekly FS.
    expect([0, 1, 2].map(primaryCell)).toEqual([
      { column: 2, row: 1 },
      { column: 1, row: 2 },
      { column: 2, row: 2 },
    ])
  })

  it('needs enough rows for the tallest area, and at least one', () => {
    expect(groupItemRows(3, [2])).toBe(2)
    expect(groupItemRows(9, [6])).toBe(6)
    expect(groupItemRows(0, [])).toBe(1)
    expect(groupItemRows(0, [4])).toBe(4)
  })
})
