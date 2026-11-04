import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageStack } from './PageStack'

describe('PageStack', () => {
  it('renders one main holding the PG Page and then the ad gallery', () => {
    render(<PageStack />)
    const mains = screen.getAllByRole('main')
    expect(mains).toHaveLength(1)
    const sections = [...mains[0].children]
    expect(sections.map((s) => s.tagName)).toEqual(['SECTION', 'SECTION'])
    expect(sections[0]).toHaveAccessibleName("Jake's First PG Page")
    expect(sections[1]).toHaveAccessibleName('Sponsored')
  })

  it('renders whatever sections it is given, in order', () => {
    const One = () => <section aria-label="One" />
    const Two = () => <section aria-label="Two" />
    render(
      <PageStack
        sections={[
          { id: 'two', Component: Two },
          { id: 'one', Component: One },
        ]}
      />,
    )
    expect(screen.getAllByRole('region').map((s) => s.getAttribute('aria-label'))).toEqual(['Two', 'One'])
  })

  it('puts the ads after every PG Page control in the tab order', () => {
    render(<PageStack />)
    const [page, gallery] = [...screen.getByRole('main').children]
    const focusables = [...document.querySelectorAll<HTMLElement>('a[href], button')]
    const lastPageControl = focusables.findLastIndex((el) => page.contains(el))
    const firstAd = focusables.findIndex((el) => gallery.contains(el))
    expect(lastPageControl).toBeGreaterThan(-1)
    expect(firstAd).toBeGreaterThan(lastPageControl)
  })
})
