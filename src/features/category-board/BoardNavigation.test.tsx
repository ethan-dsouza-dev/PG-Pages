import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { MOCK_BOARD_ITEMS, MOCK_BOARDS, MOCK_CATEGORIES } from '../../data/mock/boards'
import { toggleBoardItem } from '../../domain/boards'
import type { Board as BoardData } from '../../domain/types'
import { Board } from './Board'
import type { FolderPath } from './folderPath'

/** A Wednesday: F101 (Wednesdays), Meet Design Group (weekdays), and the daily items are on today's schedule. */
const TODAY = '2026-11-18'

function Harness({ board, initialPath }: { board: BoardData; initialPath?: FolderPath }) {
  const [items, setItems] = useState(MOCK_BOARD_ITEMS)
  return (
    <section aria-labelledby="board-title">
      <Board
        board={board}
        categories={MOCK_CATEGORIES}
        items={items}
        onToggleItem={(id) => setItems((s) => toggleBoardItem(s, id))}
        headingId="board-title"
        today={TODAY}
        initialPath={initialPath}
      />
    </section>
  )
}

const boardById = (id: string) => MOCK_BOARDS.find((b) => b.id === id)!
const groupEl = (name: string) => screen.getByRole('group', { name })
const chipsIn = (el: HTMLElement) => within(el).queryAllByRole('button')
const labels = (el: HTMLElement) => chipsIn(el).map((b) => b.getAttribute('aria-label'))
const view = (container: HTMLElement) => container.querySelector('[data-board-view]')?.getAttribute('data-board-view')
const currentFolder = (container: HTMLElement) => container.querySelector<HTMLElement>('[data-current-folder]')!

const CHILD_CAP = 'max-h-(--folder-child-max-height)'
const TODAY_BAND = "On today's schedule"
const REST_BAND = 'Not on today’s schedule'

// Open folders render every item (150+ chips), which is slow in jsdom on a busy machine.
describe('Board drill-down (LP-7.4–7.9)', { timeout: 20_000 }, () => {
  it('caps the root view and opens the category from its Open button', async () => {
    const user = userEvent.setup()
    const { container } = render(<Harness board={boardById('board-productivity')} />)
    expect(view(container)).toBe('root')
    expect(container.querySelector('[data-board-view] > div')).toHaveClass(
      'max-h-(--board-root-max-height)',
      'overflow-hidden',
    )

    await user.click(screen.getByRole('button', { name: 'Open Productivity' }))
    expect(view(container)).toBe('category')
    expect(screen.getByRole('region', { name: 'Productivity' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Up to all categories' })).toHaveFocus()
    for (const name of ['Low Day Productivity', 'Tuesday School Day', 'Wednesday School Day']) {
      expect(groupEl(name)).toHaveClass(CHILD_CAP, 'overflow-hidden')
      expect(within(groupEl(name)).getByRole('button', { name: `Open ${name}` })).toBeInTheDocument()
    }
  })

  it('opens the category when the root box itself is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(<Harness board={boardById('board-self-care')} />)
    await user.click(screen.getByRole('heading', { level: 2, name: 'Self-Care' }))
    expect(view(container)).toBe('category')
  })

  it('opens category → group → leaf, then goes up with the button, Escape, and the outer box', async () => {
    const user = userEvent.setup()
    const { container } = render(<Harness board={boardById('board-productivity')} />)
    await user.click(screen.getByRole('button', { name: 'Open Productivity' }))

    // Group: a click on the card (not on a control) opens it.
    await user.click(within(groupEl('Wednesday School Day')).getByRole('heading', { name: 'Wednesday School Day' }))
    expect(view(container)).toBe('group')
    let folder = currentFolder(container)
    expect(folder).toHaveAccessibleName('Wednesday School Day')
    expect(folder).not.toHaveClass(CHILD_CAP)
    // Only the open folder is in view: siblings are gone.
    expect(screen.queryByRole('group', { name: 'Low Day Productivity' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Up to Productivity' })).toHaveFocus()
    // Its child folder is capped; its own items are all shown, today's first.
    expect(groupEl('Wednesday Seminar')).toHaveClass(CHILD_CAP)
    expect(labels(within(folder).getByRole('group', { name: TODAY_BAND }))).toEqual([
      'F101 Assignment, 4 phases',
      'Meet Design Group',
    ])
    expect(chipsIn(within(folder).getByRole('group', { name: REST_BAND }))).toHaveLength(42)

    // Leaf: no cap, everything shown (here: nothing).
    await user.click(screen.getByRole('button', { name: 'Open Wednesday Seminar' }))
    folder = currentFolder(container)
    expect(folder).toHaveAccessibleName('Wednesday Seminar')
    expect(folder).toHaveAttribute('data-folder-leaf')
    expect(folder).not.toHaveClass(CHILD_CAP)
    expect(within(folder).getByText('No items')).not.toHaveClass('sr-only')
    const crumbs = screen.getByRole('navigation', { name: 'Productivity folder path' })
    expect(within(crumbs).getByText('Wednesday Seminar')).toHaveAttribute('aria-current', 'location')
    expect(within(crumbs).getByRole('button', { name: 'Wednesday School Day' })).toBeInTheDocument()

    // Up (button): back in the group, focus on the card we came out of.
    await user.click(screen.getByRole('button', { name: 'Up to Wednesday School Day' }))
    expect(currentFolder(container)).toHaveAccessibleName('Wednesday School Day')
    expect(screen.getByRole('button', { name: 'Open Wednesday Seminar' })).toHaveFocus()

    // Up (Escape): the category.
    await user.keyboard('{Escape}')
    expect(view(container)).toBe('category')
    expect(screen.getByRole('button', { name: 'Open Wednesday School Day' })).toHaveFocus()

    // Up (click the enclosing box, outside every folder): the root view.
    await user.click(screen.getByText('Social'))
    expect(view(container)).toBe('root')
    expect(screen.getByRole('button', { name: 'Open Productivity' })).toHaveFocus()
  })

  it('stays put on clicks inside the open folder and goes up on clicks around it', async () => {
    const user = userEvent.setup()
    const { container } = render(<Harness board={boardById('board-productivity')} initialPath={['g-wednesday']} />)
    await user.click(within(currentFolder(container)).getByRole('heading', { name: 'Wednesday School Day' }))
    expect(view(container)).toBe('group')
    await user.click(screen.getByText('Social'))
    expect(view(container)).toBe('category')
  })

  it('jumps up several levels from the breadcrumb', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Harness board={boardById('board-productivity')} initialPath={['g-wednesday', 'g-wed-seminar']} />,
    )
    await user.click(screen.getByRole('button', { name: 'Productivity' }))
    expect(view(container)).toBe('category')
    expect(screen.getByRole('button', { name: 'Open Wednesday School Day' })).toHaveFocus()
  })

  it('opens a group straight from its "See all", uncapped, today first (LP-7.8/7.9)', async () => {
    const user = userEvent.setup()
    const { container } = render(<Harness board={boardById('board-self-care')} />)
    await user.click(screen.getByRole('button', { name: /See all 22 Self-Care items in Cleaning Day/ }))
    const folder = currentFolder(container)
    expect(folder).toHaveAccessibleName('Cleaning Day')
    const today = within(folder).getByRole('group', { name: TODAY_BAND })
    expect(labels(today)).toEqual(['Clean your room', 'Meet Design Group'])
    expect(today).toHaveAttribute('data-today-band')
    const rest = within(folder).getByRole('group', { name: REST_BAND })
    expect(chipsIn(within(rest).getByRole('group', { name: 'Self-Care only' }))).toHaveLength(21)
    expect(chipsIn(within(rest).getByRole('group', { name: 'Self-Care and Social' }))).toHaveLength(133)
    // A past item sits below the outline.
    expect(within(rest).getByRole('button', { name: 'Call Plumber' })).toBeInTheDocument()
    expect(within(folder).queryByRole('button', { name: /See all/ })).toBeNull()
  })

  it('toggles a chip inside a capped card without opening it', async () => {
    const user = userEvent.setup()
    const { container } = render(<Harness board={boardById('board-self-care')} initialPath={[]} />)
    const chip = within(groupEl('Unsorted')).getAllByRole('button', { name: 'Clean your room' })[0]
    await user.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    expect(view(container)).toBe('category')
  })
})
