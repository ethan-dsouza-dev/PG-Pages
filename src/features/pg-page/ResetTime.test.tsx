import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockPage } from '../../data/mock/pgPage'
import { usePGPageStore } from '../../store/pgPageStore'
import { DayActions } from './DayActions'
import { useDailyReset } from './useDailyReset'
import { activePage, collectionOf } from '../../domain/pages'

describe('Change Reset Time (LP-5.2)', () => {
  beforeEach(() => {
    usePGPageStore.setState(collectionOf(createMockPage()))
  })

  it('opens a labelled dialog showing the current time and saves a new one', async () => {
    const user = userEvent.setup()
    render(<DayActions />)
    const trigger = screen.getByRole('button', { name: 'Change Reset Time' })

    await user.click(trigger)
    const dialog = screen.getByRole('dialog', { name: 'Change reset time' })
    expect(dialog).toHaveAccessibleDescription(/Currently 12:00 am/)
    const input = screen.getByLabelText('Reset time')
    expect(input).toHaveValue('00:00')
    expect(input).toHaveFocus()

    // jsdom has no time picker; set the value as the browser would.
    fireEvent.change(input, { target: { value: '05:30' } })
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(activePage(usePGPageStore.getState()).resetTime).toBe('05:30')
    expect(screen.getByRole('status')).toHaveTextContent('Daily reset time set to 5:30 am')
    expect(trigger).toHaveFocus()
  })

  it('Cancel and Escape leave the reset time unchanged', async () => {
    const user = userEvent.setup()
    render(<DayActions />)

    await user.click(screen.getByRole('button', { name: 'Change Reset Time' }))
    fireEvent.change(screen.getByLabelText('Reset time'), { target: { value: '07:00' } })
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Change Reset Time' }))
    // The draft starts over from the saved time.
    expect(screen.getByLabelText('Reset time')).toHaveValue('00:00')
    await user.keyboard('{Escape}')

    expect(activePage(usePGPageStore.getState()).resetTime).toBe('00:00')
  })

  it('disables Save while the time is empty', async () => {
    const user = userEvent.setup()
    render(<DayActions />)
    await user.click(screen.getByRole('button', { name: 'Change Reset Time' }))
    fireEvent.change(screen.getByLabelText('Reset time'), { target: { value: '' } })
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })
})

describe('useDailyReset (LP-5.3)', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('resets goals, themes and today\'s tasks once the reset time passes, and only once', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
    vi.setSystemTime(new Date('2026-10-10T23:59:00Z'))
    usePGPageStore.setState(collectionOf(createMockPage(new Date(), 'UTC')))
    const completed = () => activePage(usePGPageStore.getState()).goals.filter((g) => g.completed).map((g) => g.id)
    expect(completed()).toEqual(['day-read', 'month-gym'])

    renderHook(() => useDailyReset(30_000))
    expect(completed()).toEqual(['day-read', 'month-gym'])

    act(() => vi.advanceTimersByTime(60_000)) // past 00:00 UTC, mid-month
    expect(completed()).toEqual(['month-gym'])
    const resetAt = activePage(usePGPageStore.getState()).lastResetAt
    expect(new Date(resetAt) >= new Date('2026-10-11T00:00:00Z')).toBe(true)

    act(() => usePGPageStore.getState().toggleGoal('theme-discipline'))
    act(() => vi.advanceTimersByTime(60 * 60_000))
    expect(completed()).toEqual(['month-gym', 'theme-discipline'])
    expect(activePage(usePGPageStore.getState()).lastResetAt).toBe(resetAt)
  })

  it('also resets month goals at the first reset of a new month', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
    vi.setSystemTime(new Date('2026-10-31T23:59:00Z'))
    usePGPageStore.setState(collectionOf(createMockPage(new Date(), 'UTC')))
    renderHook(() => useDailyReset(30_000))
    act(() => vi.advanceTimersByTime(60_000)) // past 00:00 UTC on Nov 1
    expect(activePage(usePGPageStore.getState()).goals.some((g) => g.completed)).toBe(false)
  })
})
