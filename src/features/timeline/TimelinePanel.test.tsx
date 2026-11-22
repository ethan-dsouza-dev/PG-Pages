import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockPage } from '../../data/mock/pgPage'
import { getTimelineWindow } from '../../domain/timeline'
import { formatDayLabel } from '../../domain/timelineFormat'
import { usePGPageStore } from '../../store/pgPageStore'
import { TEST_ELEMENT_WIDTH } from '../../test/setup'
import { TIMELINE } from './layout'
import { TimelinePanel } from './TimelinePanel'

const dayWidth = Math.round(TEST_ELEMENT_WIDTH * TIMELINE.dayWidthRatio)
const maxScroll = dayWidth * 3 - TEST_ELEMENT_WIDTH

describe('TimelinePanel', () => {
  beforeEach(() => {
    usePGPageStore.setState({ page: createMockPage(), showFullDay: false })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("opens on today's date", () => {
    render(<TimelinePanel />)
    const { timeZone } = usePGPageStore.getState().page
    const today = getTimelineWindow(new Date(), timeZone).days[1]
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(formatDayLabel(today, timeZone))
  })

  it('toggles a task bar between done and to do', async () => {
    const user = userEvent.setup()
    render(<TimelinePanel />)
    const bar = screen.getByRole('button', { name: /^Pre-reading, .*, done$/ })
    expect(bar).toHaveAttribute('aria-pressed', 'true')

    await user.click(bar)
    const updated = screen.getByRole('button', { name: /^Pre-reading, .*, to do$/ })
    expect(updated).toHaveAttribute('aria-pressed', 'false')
  })

  it('opens a phase with its nested sub-phases and returns focus on close', async () => {
    const user = userEvent.setup()
    render(<TimelinePanel />)
    const phase = screen.getByRole('button', { name: /^Research phase of F101 Assignment/ })

    await user.click(phase)
    const dialog = screen.getByRole('dialog', { name: 'Research' })
    expect(dialog).toHaveTextContent('Find sources')
    expect(dialog).toHaveTextContent('Take notes')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(phase).toHaveFocus()
  })

  it('scrolls to a neighboring day from the day links', async () => {
    const user = userEvent.setup()
    const scrollTo = vi.spyOn(Element.prototype, 'scrollTo')
    render(<TimelinePanel />)

    await user.click(screen.getByRole('button', { name: 'Tomorrow' }))
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: maxScroll }))

    await user.click(screen.getByRole('button', { name: 'Yesterday' }))
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 0 }))
  })

  it('changes day with the arrow keys when the scroller is focused', async () => {
    const user = userEvent.setup()
    const scrollTo = vi.spyOn(Element.prototype, 'scrollTo')
    render(<TimelinePanel />)

    screen.getByRole('region', { name: /Timeline days/ }).focus()
    await user.keyboard('{ArrowRight}')
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: maxScroll }))
  })

  it('renders week navigation and Add Timed Task as placeholders', () => {
    render(<TimelinePanel />)
    for (const name of ['Last week', 'This week', 'Next week', 'Add Timed Task']) {
      expect(screen.getByRole('button', { name: `${name}, coming soon` })).toHaveAttribute(
        'aria-disabled',
        'true',
      )
    }
  })

  it('keeps All Day and untimed tasks off the sheet and lists them in the All Day popover', async () => {
    const user = userEvent.setup()
    render(<TimelinePanel />)
    const sheet = screen.getByRole('group', { name: /Tasks from yesterday to tomorrow/ })
    expect(within(sheet).queryByRole('button', { name: /birthday|Pay rent/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'All Day (2)' }))
    const popover = screen.getByRole('dialog', { name: /All Day: Today/ })
    expect(popover).toHaveTextContent("Grandma's birthday")
    expect(popover).toHaveTextContent('Pay rent, done')
    expect(popover).not.toHaveTextContent('Return library books')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'All Day (2)' })).toHaveFocus()
  })

  it('stretches the day to 24 hours from the Show 24 hours checkbox', async () => {
    const user = userEvent.setup()
    render(<TimelinePanel />)
    const barX = () =>
      Number(
        screen
          .getByRole('button', { name: /^Pre-reading, / })
          .querySelector('rect')
          ?.getAttribute('x'),
      )
    const defaultX = barX()

    const checkbox = screen.getByRole('checkbox', { name: 'Show 24 hours' })
    await user.click(checkbox)
    expect(usePGPageStore.getState().showFullDay).toBe(true)
    // 07:30 sits further into a 24-hour day than into a 07:00–22:00 one.
    expect(barX()).toBeGreaterThan(defaultX)

    await user.click(checkbox)
    expect(barX()).toBe(defaultX)
  })

  it('hides the now indicator outside the visible hours', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const lateNight = new Date()
    lateNight.setHours(23, 30, 0, 0)
    vi.setSystemTime(lateNight)
    usePGPageStore.setState({ page: createMockPage() })

    const { unmount } = render(<TimelinePanel />)
    expect(screen.queryByTestId('now-indicator')).not.toBeInTheDocument()
    unmount()

    usePGPageStore.setState({ showFullDay: true })
    render(<TimelinePanel />)
    expect(screen.getByTestId('now-indicator')).toBeInTheDocument()
    vi.useRealTimers()
  })
})
