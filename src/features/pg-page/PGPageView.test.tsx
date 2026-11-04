import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PGPageView } from './PGPageView'

describe('PGPageView', () => {
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
})
