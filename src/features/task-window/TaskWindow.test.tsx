import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMockPage } from '../../data/mock/pgPage'
import { taskKey, tasksForKey } from '../../domain/boardTasks'
import { activePage, collectionOf } from '../../domain/pages'
import { usePGPageStore } from '../../store/pgPageStore'
import { GoalSections } from '../pg-page/GoalSections'
import { TaskWindowHost } from './TaskWindowHost'

const page = () => activePage(usePGPageStore.getState())
const open = (request: Parameters<ReturnType<typeof usePGPageStore.getState>['openTaskWindow']>[0]) =>
  act(() => usePGPageStore.getState().openTaskWindow(request))

function renderPage() {
  return render(
    <>
      <GoalSections />
      <TaskWindowHost />
    </>,
  )
}

describe('task window', () => {
  beforeEach(() => {
    usePGPageStore.setState({ ...collectionOf(createMockPage()), taskWindow: null, instanceDialog: null })
  })

  it('"+" on a goal section opens a new goal on that tab and saves it there (TW-1.3)', async () => {
    const user = userEvent.setup()
    renderPage()
    const plus = screen.getByRole('button', { name: 'Add month goal' })
    await user.click(plus)

    const dialog = screen.getByRole('dialog', { name: 'New goal' })
    expect(within(dialog).getByRole('tab', { name: 'Goal' })).toHaveAttribute('aria-selected', 'true')
    expect(within(dialog).getByRole('combobox', { name: 'How long-term is this goal?' })).toHaveValue('month')

    await user.type(within(dialog).getByRole('textbox', { name: 'Label' }), 'Learn to swim')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const month = screen.getByRole('region', { name: 'Goals for the month' })
    expect(within(month).getByRole('button', { name: 'Learn to swim' })).toBeInTheDocument()
    expect(plus).toHaveFocus()
  })

  it('refuses to save without a label and focuses it (TW-5.2)', async () => {
    const user = userEvent.setup()
    renderPage()
    open({ mode: 'new', prefill: { kind: 'task' } })
    const dialog = screen.getByRole('dialog', { name: 'New task' })

    await user.click(within(dialog).getByRole('button', { name: 'Save' }))
    const label = within(dialog).getByRole('textbox', { name: 'Label' })
    expect(label).toHaveAttribute('aria-invalid', 'true')
    expect(label).toHaveAccessibleDescription('Add a label.')
    await act(() => new Promise(requestAnimationFrame))
    expect(label).toHaveFocus()
    expect(within(dialog).getByRole('status')).toHaveTextContent('Fix 1 problem to save.')
  })

  it('asks before throwing away unsaved changes (TW-5.3)', async () => {
    const user = userEvent.setup()
    renderPage()
    open({ mode: 'new', prefill: { kind: 'task' } })
    const dialog = screen.getByRole('dialog', { name: 'New task' })
    await user.type(within(dialog).getByRole('textbox', { name: 'Label' }), 'Draft')

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    const prompt = screen.getByRole('alertdialog', { name: 'Discard changes?' })
    await user.click(within(prompt).getByRole('button', { name: 'Keep editing' }))
    expect(within(dialog).getByRole('textbox', { name: 'Label' })).toHaveValue('Draft')

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: 'Discard changes' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('splits a task into subphases and edits one on its own panel (TW-4)', async () => {
    const user = userEvent.setup()
    renderPage()
    open({ mode: 'new', prefill: { kind: 'task' } })
    const dialog = screen.getByRole('dialog', { name: 'New task' })
    await user.type(within(dialog).getByRole('textbox', { name: 'Label' }), 'Essay')
    const count = within(dialog).getByRole('spinbutton', { name: 'How many' })
    await user.clear(count)
    await user.type(count, '3')
    await user.click(within(dialog).getByRole('button', { name: 'Split into subphases' }))

    expect(within(dialog).getAllByRole('button', { name: /^Edit Phase \d/ })).toHaveLength(3)
    await user.click(within(dialog).getByRole('button', { name: 'Edit Phase 2' }))
    expect(within(dialog).getByRole('navigation', { name: 'Subphase path' })).toHaveTextContent('Essay›Phase 2')
    await user.type(within(dialog).getByRole('textbox', { name: 'Member assigned (optional)' }), 'Sam')
    await user.click(within(dialog).getByRole('button', { name: 'Delete this subphase' }))

    // Back on the task, with a gap where Phase 2 was (TW-4.6).
    expect(within(dialog).getAllByRole('button', { name: /^Edit Phase \d/ }).map((b) => b.textContent)).toEqual(['Phase 1', 'Phase 2'])
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    const saved = page().tasks.find((t) => t.title === 'Essay')!
    expect(saved.phases).toHaveLength(2)
    expect(saved.split).toBe('custom')
    expect(Date.parse(saved.phases![1].start)).toBeGreaterThan(Date.parse(saved.phases![0].end))
  })

  it('asks which occurrences to change when a repeating task moves (TW-6.4)', async () => {
    const user = userEvent.setup()
    renderPage()
    const before = tasksForKey(page().tasks, 'make-the-bed')
    open({ mode: 'edit', kind: 'task', taskId: before[1].id })
    const dialog = screen.getByRole('dialog', { name: 'Edit task' })
    const starts = within(dialog).getByLabelText('Starts')
    const value = (starts as HTMLInputElement).value
    await user.clear(starts)
    await user.type(starts, value.replace(/T\d\d/, 'T07'))

    await user.click(within(dialog).getByRole('button', { name: 'Save' }))
    const prompt = screen.getByRole('alertdialog', { name: 'Change which occurrences?' })
    expect(within(prompt).getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Cancel',
      'Only this one',
      'This and following',
      'All',
    ])
    await user.click(within(prompt).getByRole('button', { name: 'Only this one' }))

    const after = tasksForKey(page().tasks, 'make-the-bed')
    expect(after[0].start).toBe(before[0].start)
    expect(after[1].start).not.toBe(before[1].start)
    expect(after[2].start).toBe(before[2].start)
  })

  it('creates and lists instances (TW-6.1, TW-6.2)', async () => {
    const user = userEvent.setup()
    renderPage()
    const key = taskKey(page().tasks.find((t) => t.id === 'pre-reading')!)
    act(() => usePGPageStore.getState().openInstanceDialog({ taskId: 'pre-reading', view: 'create' }))
    await user.click(screen.getByRole('button', { name: 'Add instance' }))
    expect(tasksForKey(page().tasks, key)).toHaveLength(2)

    act(() => usePGPageStore.getState().openInstanceDialog({ taskId: 'pre-reading', view: 'list' }))
    const list = screen.getByRole('dialog', { name: 'Instances of Pre-reading' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    await user.click(within(list).getAllByRole('button', { name: /^Edit the / })[0])
    expect(screen.getByRole('dialog', { name: 'Edit this occurrence' })).toBeInTheDocument()
  })
})
