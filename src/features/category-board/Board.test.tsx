import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { MOCK_BOARD_ITEMS, MOCK_BOARDS, MOCK_CATEGORIES } from '../../data/mock/boards'
import { toggleBoardItem } from '../../domain/boards'
import type { Board as BoardData, BoardItem } from '../../domain/types'
import { Board } from './Board'

function Harness({ board, items = MOCK_BOARD_ITEMS }: { board: BoardData; items?: Record<string, BoardItem> }) {
  const [state, setState] = useState(items)
  return (
    <section aria-labelledby="board-title">
      <Board
        board={board}
        categories={MOCK_CATEGORIES}
        items={state}
        onToggleItem={(id) => setState((s) => toggleBoardItem(s, id))}
        headingId="board-title"
      />
    </section>
  )
}

const boardById = (id: string) => MOCK_BOARDS.find((b) => b.id === id)!
const groupEl = (name: string) => screen.getByRole('group', { name })
const chipsIn = (el: HTMLElement) =>
  within(el)
    .queryAllByRole('button')
    .filter((b) => !b.textContent?.includes('See all'))

describe('Board', () => {
  it('is labelled by its category name and themed by its category', () => {
    const { container } = render(<Harness board={boardById('board-self-care')} />)
    expect(screen.getByRole('region', { name: 'Self-Care' })).toBeInTheDocument()
    expect(container.querySelector('[data-board-theme]')).toHaveAttribute('data-board-theme', 'self-care')
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Cleaning Day', 'Unsorted'])
  })

  it('caps a compact group with overflow and shows real "See all" counts', () => {
    render(<Harness board={boardById('board-self-care')} />)
    const group = groupEl('Cleaning Day')
    const primary = within(group).getByRole('group', { name: 'Self-Care only' })
    const lane = within(group).getByRole('group', { name: 'Self-Care and Social' })

    expect(chipsIn(primary)).toHaveLength(3)
    expect(chipsIn(lane)).toHaveLength(2)
    expect(within(primary).getByRole('button', { name: /See all 22 Self-Care items in Cleaning Day/ })).toBeInTheDocument()
    expect(
      within(lane).getByRole('button', { name: /See all 134 Self-Care and Social items in Cleaning Day/ }),
    ).toBeInTheDocument()
  })

  it('shows every item in an expanded group, with no "See all"', () => {
    render(<Harness board={boardById('board-self-care')} />)
    const group = groupEl('Unsorted')
    expect(chipsIn(within(group).getByRole('group', { name: 'Self-Care only' }))).toHaveLength(9)
    expect(chipsIn(within(group).getByRole('group', { name: 'Self-Care and Social' }))).toHaveLength(6)
    expect(within(group).queryByRole('button', { name: /See all/ })).toBeNull()
  })

  it('renders an empty group with a hidden "No items" message and no "See all"', () => {
    render(<Harness board={boardById('board-productivity')} />)
    const group = groupEl('Tuesday School Day')
    expect(within(group).getByText('No items')).toHaveClass('sr-only')
    expect(within(group).queryAllByRole('button')).toHaveLength(0)
  })

  it('renders the note and a nested group with an h4 inside its parent', () => {
    render(<Harness board={boardById('board-productivity')} />)
    expect(screen.getByText("(essentially it's priority tasks)")).toBeInTheDocument()
    const parent = groupEl('Wednesday School Day')
    const child = within(parent).getByRole('group', { name: 'Wednesday Seminar' })
    expect(within(child).getByRole('heading', { level: 4, name: 'Wednesday Seminar' })).toBeInTheDocument()
  })

  it('toggles a chip between to do and done', async () => {
    const user = userEvent.setup()
    render(<Harness board={boardById('board-self-care')} />)
    const primary = within(groupEl('Unsorted')).getByRole('group', { name: 'Self-Care only' })
    const chip = within(primary).getAllByRole('button', { name: 'Clean your room' })[0]
    expect(chip).toHaveAttribute('aria-pressed', 'false')
    await user.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    await user.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'false')
  })

  it('announces phase chips and draws their segments', () => {
    render(<Harness board={boardById('board-self-care')} />)
    const primary = within(groupEl('Cleaning Day')).getByRole('group', { name: 'Self-Care only' })
    const chip = within(primary).getByRole('button', { name: 'Weekly FS Project, 4 phases' })
    expect(chip.querySelectorAll('[data-phase-segment]')).toHaveLength(4)
  })

  it('makes inactive chips aria-disabled, says "inactive", and ignores clicks', async () => {
    const user = userEvent.setup()
    render(<Harness board={boardById('board-self-care')} />)
    const lane = within(groupEl('Unsorted')).getByRole('group', { name: 'Self-Care and Social' })
    const chip = within(lane).getByRole('button', { name: 'Meet Design Group, inactive' })
    expect(chip).toHaveAttribute('aria-disabled', 'true')
    expect(chip).not.toHaveAttribute('aria-pressed')
    await user.click(chip)
    expect(within(lane).getByRole('button', { name: 'Meet Design Group, inactive' })).toBeInTheDocument()
  })

  it('works with zero lanes: no band, no lane label, everything primary', () => {
    const board: BoardData = { ...boardById('board-self-care'), overlapCategoryIds: [] }
    const { container } = render(<Harness board={board} />)
    expect(container.querySelector('[data-overlap-lane]')).toBeNull()
    expect(screen.queryByText('Social')).toBeNull()
    const unsorted = groupEl('Unsorted')
    expect(chipsIn(within(unsorted).getByRole('group', { name: 'Self-Care' }))).toHaveLength(15)
  })

  it('draws one band per lane', () => {
    const board: BoardData = { ...boardById('board-self-care'), overlapCategoryIds: ['social', 'leisure'] }
    const { container } = render(<Harness board={board} />)
    expect(container.querySelectorAll('[data-overlap-lane]')).toHaveLength(2)
  })

  it('tabs through primary, its See all, the lane, its See all, then child groups and the add bar', async () => {
    const user = userEvent.setup()
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const board = boardById('board-productivity')
    render(<Harness board={board} />)
    const names: string[] = []
    for (let i = 0; i < 15; i++) {
      await user.tab()
      names.push(document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent ?? '')
    }
    expect(names.slice(0, 7)).toEqual([
      'Weekly FS Project, 4 phases',
      'Clean your room',
      'F101 Assignment, 4 phases',
      expect.stringContaining('See all 22 Productivity items in Low Day Productivity'),
      'Call Plumber',
      'Meet Design Group',
      expect.stringContaining('See all 134 Productivity and Social items in Low Day Productivity'),
    ])
    expect(names.at(-1)).toMatch(/Add group to Productivity/)
    info.mockRestore()
  })
})
