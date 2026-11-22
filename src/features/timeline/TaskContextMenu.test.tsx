import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockPage } from '../../data/mock/pgPage'
import { usePGPageStore } from '../../store/pgPageStore'
import { TimelinePanel } from './TimelinePanel'

const taskBar = (title: string) => screen.getByRole('button', { name: new RegExp(`^${title}, `) })

const storedTask = (id: string) => usePGPageStore.getState().page.tasks.find((t) => t.id === id)

async function openMenu(user: ReturnType<typeof userEvent.setup>, bar: Element) {
  await user.pointer({ keys: '[MouseRight]', target: bar })
  return screen.getByRole('menu', { name: /^Actions for / })
}

describe('task context menu', () => {
  beforeEach(() => {
    usePGPageStore.setState({ page: createMockPage() })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('lists Edit, Create new instance, Duplicate, Remove, Delete in order', async () => {
    const user = userEvent.setup()
    render(<TimelinePanel />)
    const menu = await openMenu(user, taskBar('Weekly FS Project'))

    const items = within(menu).getAllByRole('menuitem')
    expect(items.map((i) => i.textContent)).toEqual([
      'Edit, coming soon',
      'Create new instance, coming soon',
      'Duplicate, coming soon',
      'Remove',
      'Delete',
    ])
  })

  it('opens from the keyboard with Shift+F10', async () => {
    const user = userEvent.setup()
    render(<TimelinePanel />)
    taskBar('Weekly FS Project').focus()

    await user.keyboard('{Shift>}{F10}{/Shift}')
    expect(screen.getByRole('menu', { name: 'Actions for Weekly FS Project' })).toBeInTheDocument()
  })

  it('logs the placeholder items without changing the task', async () => {
    const user = userEvent.setup()
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    render(<TimelinePanel />)
    const menu = await openMenu(user, taskBar('Weekly FS Project'))

    await user.click(within(menu).getByRole('menuitem', { name: /^Duplicate/ }))
    expect(info).toHaveBeenCalledWith(expect.stringContaining('Duplicate'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(usePGPageStore.getState().page.tasks).toHaveLength(createMockPage().tasks.length)
  })

  it('Remove takes the task off the timeline but keeps it in the page', async () => {
    const user = userEvent.setup()
    render(<TimelinePanel />)
    const menu = await openMenu(user, taskBar('Weekly FS Project'))

    await user.click(within(menu).getByRole('menuitem', { name: 'Remove' }))
    expect(screen.queryByRole('button', { name: /^Weekly FS Project, / })).not.toBeInTheDocument()
    expect(storedTask('weekly-fs-project')).toMatchObject({ unscheduled: true })
    expect(screen.getByRole('region', { name: /Timeline days/ })).toHaveFocus()
  })

  it('greys out Remove for a task that is no longer upcoming', async () => {
    const user = userEvent.setup()
    render(<TimelinePanel />)
    // Yesterday's "Make the bed" instance has already ended.
    const [yesterday] = screen.getAllByRole('button', { name: /^Make the bed, / })
    const menu = await openMenu(user, yesterday)

    const remove = within(menu).getByRole('menuitem', { name: 'Remove' })
    expect(remove).toHaveAttribute('aria-disabled', 'true')
    await user.click(remove)
    expect(storedTask('make-bed-0')?.unscheduled).toBeUndefined()
  })

  it('Delete → Cancel keeps the task and returns focus to it', async () => {
    const user = userEvent.setup()
    render(<TimelinePanel />)
    const bar = taskBar('Weekly FS Project')
    bar.focus()
    await user.keyboard('{Shift>}{F10}{/Shift}')

    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
    const dialog = screen.getByRole('alertdialog', { name: 'Are you sure?' })
    expect(dialog).toHaveAccessibleDescription('Your task will be permanently deleted.')
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus()

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(storedTask('weekly-fs-project')).toBeDefined()
    expect(taskBar('Weekly FS Project')).toHaveFocus()
  })

  it('Delete → Proceed removes the task from the page data', async () => {
    const user = userEvent.setup()
    render(<TimelinePanel />)
    const menu = await openMenu(user, taskBar('Weekly FS Project'))

    await user.click(within(menu).getByRole('menuitem', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Proceed' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(storedTask('weekly-fs-project')).toBeUndefined()
    expect(screen.queryByRole('button', { name: /^Weekly FS Project, / })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: /Timeline days/ })).toHaveFocus()
  })
})
