import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMockPage } from '../../data/mock/pgPage'
import { collectionOf } from '../../domain/pages'
import { usePGPageStore } from '../../store/pgPageStore'
import { PageFooter } from '../page-footer/PageFooter'
import { PGPageView } from './PGPageView'

/** The PG Page section plus the footer, the two places the page name shows. */
function renderPage() {
  return render(
    <>
      <PGPageView />
      <PageFooter />
    </>,
  )
}

const nameBox = () => screen.getByRole('textbox', { name: 'Page name' })
const title = () => screen.getByRole('heading', { level: 1 })
const footer = () => screen.getByRole('contentinfo')
const switcher = () => screen.getByRole('button', { name: 'Your PG Pages' })
const pageList = () => screen.getByRole('list', { name: 'Your PG Pages' })

describe('PG Page name and switching', () => {
  beforeEach(() => {
    usePGPageStore.setState(collectionOf(createMockPage()))
  })

  it('LP-2.1: the name box renames the page in the header and footer', async () => {
    const user = userEvent.setup()
    renderPage()
    expect(nameBox()).toHaveValue("Jake's First")
    expect(title()).toHaveAccessibleName("Jake's First PG Page")
    expect(footer()).toHaveTextContent("Jake's First PG Page")

    await user.clear(nameBox())
    await user.type(nameBox(), 'Fall Term')

    expect(title()).toHaveAccessibleName('Fall Term PG Page')
    expect(screen.getByRole('region', { name: 'Fall Term PG Page' })).toBeInTheDocument()
    expect(footer()).toHaveTextContent('Fall Term PG Page')
  })

  it('LP-2.1: a cleared name falls back to "Untitled" wherever it is shown', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.clear(nameBox())
    expect(nameBox()).toHaveAttribute('placeholder', 'Untitled')
    expect(title()).toHaveAccessibleName('Untitled PG Page')
    expect(footer()).toHaveTextContent('Untitled PG Page')
  })

  it('LP-2.2: New PG Page shows an empty page and selects its name for typing', async () => {
    const user = userEvent.setup()
    renderPage()
    expect(screen.getAllByRole('button', { name: /^(Clean your room|Read 20 pages)/ }).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'New PG Page' }))

    expect(nameBox()).toHaveValue('Untitled')
    expect(nameBox()).toHaveFocus()
    expect(screen.queryByRole('button', { name: /Clean your room/ })).not.toBeInTheDocument()

    await user.keyboard('Spring')
    expect(title()).toHaveAccessibleName('Spring PG Page')
    expect(footer()).toHaveTextContent('Spring PG Page')
  })

  it('LP-2.3: Your PG Pages lists every page and switches the whole page', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: 'New PG Page' }))
    await user.keyboard('Spring')

    expect(switcher()).toHaveAttribute('aria-expanded', 'false')
    await user.click(switcher())
    expect(switcher()).toHaveAttribute('aria-expanded', 'true')
    const options = within(pageList()).getAllByRole('button')
    expect(options.map((o) => o.textContent)).toEqual(["✓Jake's First", '✓Spring'])
    expect(within(pageList()).getByRole('button', { name: 'Spring' })).toHaveAttribute('aria-current', 'page')
    expect(within(pageList()).getByRole('button', { name: 'Spring' })).toHaveFocus()

    await user.click(within(pageList()).getByRole('button', { name: "Jake's First" }))

    expect(switcher()).toHaveAttribute('aria-expanded', 'false')
    expect(switcher()).toHaveFocus()
    expect(nameBox()).toHaveValue("Jake's First")
    expect(footer()).toHaveTextContent("Jake's First PG Page")
    expect(screen.getAllByRole('button', { name: /Clean your room/ }).length).toBeGreaterThan(0)
  })

  it('LP-2.3: the list works from the keyboard and Escape closes it', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: 'New PG Page' }))

    switcher().focus()
    await user.keyboard('{Enter}')
    expect(within(pageList()).getByRole('button', { name: 'Untitled' })).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(within(pageList()).getByRole('button', { name: "Jake's First" })).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(switcher()).toHaveAttribute('aria-expanded', 'false')
    expect(switcher()).toHaveFocus()
    expect(nameBox()).toHaveValue('Untitled')

    await user.keyboard('{Enter}')
    await user.keyboard('{ArrowUp}{Enter}')
    expect(nameBox()).toHaveValue("Jake's First")
  })
})
