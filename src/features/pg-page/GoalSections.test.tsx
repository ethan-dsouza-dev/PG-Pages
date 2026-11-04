import { Profiler, type ProfilerOnRenderCallback } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMockPage } from '../../data/mock/pgPage'
import { usePGPageStore } from '../../store/pgPageStore'
import { GoalSection } from './GoalSection'
import { GoalSections } from './GoalSections'

describe('GoalSections', () => {
  beforeEach(() => {
    usePGPageStore.setState({ page: createMockPage() })
  })

  it('renders the three sections with their chips and a "+" at the end', () => {
    render(<GoalSections />)
    const day = screen.getByRole('region', { name: 'Goals for the day' })
    const month = screen.getByRole('region', { name: 'Goals for the month' })
    const themes = screen.getByRole('region', { name: 'Themes and Values for the month' })

    expect(within(day).getAllByRole('listitem')).toHaveLength(6)
    expect(within(month).getAllByRole('listitem')).toHaveLength(6)
    expect(within(themes).getAllByRole('listitem')).toHaveLength(2)

    const lastDayItem = within(day).getAllByRole('listitem').at(-1)!
    expect(within(lastDayItem).getByRole('button')).toHaveAccessibleName('Add day goal, coming soon')
  })

  it('toggles a chip between to do and done', async () => {
    const user = userEvent.setup()
    render(<GoalSections />)
    const chip = screen.getByRole('button', { name: 'Clean your room' })

    expect(chip).toHaveAttribute('aria-pressed', 'false')
    await user.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    expect(chip).toHaveClass('bg-goal-done')
  })

  it('does not re-render other sections when a chip toggles', async () => {
    const user = userEvent.setup()
    const commits: Record<string, number> = { day: 0, month: 0 }
    const onRender: ProfilerOnRenderCallback = (id) => {
      commits[id]++
    }
    render(
      <>
        <Profiler id="day" onRender={onRender}>
          <GoalSection title="Goals for the day" scope="day" addLabel="Add day goal" />
        </Profiler>
        <Profiler id="month" onRender={onRender}>
          <GoalSection title="Goals for the month" scope="month" addLabel="Add month goal" />
        </Profiler>
      </>,
    )
    const monthBefore = commits.month
    const dayBefore = commits.day

    await user.click(screen.getByRole('button', { name: 'Clean your room' }))

    expect(commits.day).toBeGreaterThan(dayBefore)
    expect(commits.month).toBe(monthBefore)
  })
})
