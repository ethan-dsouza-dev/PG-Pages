import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMockPage } from '../../data/mock/pgPage'
import { usePGPageStore } from '../../store/pgPageStore'
import { PGPageView } from './PGPageView'

const pressed = (name: string | RegExp) =>
  screen.getByRole('button', { name }).getAttribute('aria-pressed')

describe('PGPageView', () => {
  beforeEach(() => {
    usePGPageStore.setState({ page: createMockPage() })
  })

  it('has one main landmark and one h1 with the full page title', () => {
    render(<PGPageView />)
    expect(screen.getAllByRole('main')).toHaveLength(1)
    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveAccessibleName("Jake's First PG Page")
  })

  it('shows the version', () => {
    render(<PGPageView />)
    expect(screen.getByText('Version 1')).toBeInTheDocument()
  })

  it('renders the page-action links as placeholders inside a labeled nav', () => {
    render(<PGPageView />)
    const nav = screen.getByRole('navigation', { name: 'Page actions' })
    const links = within(nav).getAllByRole('button')
    expect(links.map((l) => l.textContent)).toEqual([
      'Export to Sheets, coming soon',
      'Export to Calendar, coming soon',
      'Export Additions to Calendar, coming soon',
      'New PG Page, coming soon',
      'Other PG Pages, coming soon',
    ])
    for (const link of links) expect(link).toHaveAttribute('aria-disabled', 'true')
  })

  it('renders "visit other versions" as a placeholder', () => {
    render(<PGPageView />)
    expect(screen.getByRole('button', { name: 'visit other versions, coming soon' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('Check All and Reset Day act on day goals and today\'s timeline bars only', async () => {
    const user = userEvent.setup()
    render(<PGPageView />)
    const day = screen.getByRole('region', { name: 'Goals for the day' })
    // Every button in the section except the trailing "+" placeholder.
    const dayChips = () => within(day).getAllByRole('button').filter((b) => b.hasAttribute('aria-pressed'))

    await user.click(screen.getByRole('button', { name: 'Check All' }))
    expect(screen.getByRole('status')).toHaveTextContent('marked complete')
    for (const chip of dayChips()) expect(chip).toHaveAttribute('aria-pressed', 'true')
    expect(pressed(/^Weekly FS Project, /)).toBe('true')
    expect(pressed(/^Make the bed, .* tomorrow to .* tomorrow/)).toBe('false')
    expect(pressed('Pass F101')).toBe('false')

    await user.click(screen.getByRole('button', { name: 'Reset Day' }))
    expect(screen.getByRole('status')).toHaveTextContent('reset')
    for (const chip of dayChips()) expect(chip).toHaveAttribute('aria-pressed', 'false')
    expect(pressed(/^Weekly FS Project, /)).toBe('false')
    expect(pressed(/^Pre-reading, /)).toBe('false')
    // Yesterday's instance and completed month goals are untouched.
    expect(pressed(/^Make the bed, .* yesterday to .* yesterday/)).toBe('true')
    expect(pressed('Gym 12 times')).toBe('true')
  })

  it('renders Select Task(s) as a placeholder', () => {
    render(<PGPageView />)
    expect(screen.getByRole('button', { name: 'Select Task(s), coming soon' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })
})
