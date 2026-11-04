import { render, screen } from '@testing-library/react'
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
    usePGPageStore.setState({ page: createMockPage() })
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
})
