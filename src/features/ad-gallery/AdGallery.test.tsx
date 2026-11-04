import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MOCK_ADS } from '../../data/mock/ads'
import type { Ad } from '../../domain/types'
import { usePGPageStore } from '../../store/pgPageStore'
import { AdGallerySection } from './AdGallerySection'
import { GalleryWall } from './GalleryWall'
import { hangFrames, WALL } from './layout'

const withCaption = MOCK_ADS.find((a) => a.caption) as Ad
const withoutCaption = MOCK_ADS.filter((a) => !a.caption)

describe('GalleryWall', () => {
  it.each([1, 2, 3])('hangs %i ad(s) as links in order', (count) => {
    const ads = MOCK_ADS.slice(0, count)
    render(<GalleryWall ads={ads} />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(count)
    links.forEach((link, i) => expect(link).toHaveAttribute('href', ads[i].href))
  })

  it('names each ad as an advertisement, with the caption when there is one', () => {
    render(<GalleryWall ads={[withoutCaption[0], withCaption]} />)
    expect(
      screen.getByRole('link', { name: `Advertisement: ${withoutCaption[0].advertiser}` }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: `Advertisement: ${withCaption.advertiser}, ${withCaption.caption}` }),
    ).toBeInTheDocument()
  })

  it('shows a caption only when the ad has one', () => {
    const { container, rerender } = render(<GalleryWall ads={[withCaption]} />)
    expect(container.querySelectorAll('figcaption')).toHaveLength(1)
    expect(screen.getByText(withCaption.caption as string)).toBeInTheDocument()

    rerender(<GalleryWall ads={withoutCaption.slice(0, 3)} />)
    expect(container.querySelectorAll('figcaption')).toHaveLength(0)
  })

  it('opens ads in a new tab, marked sponsored', () => {
    render(<GalleryWall ads={MOCK_ADS.slice(0, 3)} />)
    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link.getAttribute('rel')?.split(' ')).toEqual(
        expect.arrayContaining(['sponsored', 'noopener', 'noreferrer']),
      )
    }
  })

  it('reserves each image size and loads it lazily', () => {
    const ad = MOCK_ADS[0]
    render(<GalleryWall ads={[ad]} />)
    const img = screen.getByRole('img', { name: ad.image.alt })
    expect(img).toHaveAttribute('width', String(ad.image.width))
    expect(img).toHaveAttribute('height', String(ad.image.height))
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAttribute('decoding', 'async')
  })
})

describe('hangFrames', () => {
  it('uses the mockup hang for a full set, filling the wall exactly', () => {
    const hang = hangFrames(WALL.slots.length)
    expect(hang.justify).toBe('start')
    expect(hang.placements.map((p) => p.column)).toEqual([2, 4, 6])
    const total = WALL.leadFr + WALL.slots.reduce((sum, s) => sum + s.widthFr + s.gapAfterFr, 0)
    expect(total).toBeCloseTo(1, 3)
  })

  it('centers a partial set and drops frames beyond the slots', () => {
    expect(hangFrames(2)).toMatchObject({ justify: 'center', placements: [{ column: 1 }, { column: 3 }] })
    expect(hangFrames(1).placements).toHaveLength(1)
    expect(hangFrames(0).placements).toHaveLength(0)
    expect(hangFrames(5).placements).toHaveLength(WALL.slots.length)
  })
})

describe('AdGallerySection', () => {
  it('is a section labelled by a visually hidden "Sponsored" heading', () => {
    usePGPageStore.setState({ galleryAds: MOCK_ADS.slice(0, 3) })
    render(<AdGallerySection />)
    const section = screen.getByRole('region', { name: 'Sponsored' })
    expect(screen.getByRole('heading', { level: 2, name: 'Sponsored' })).toHaveClass('sr-only')
    expect(within(section).getAllByRole('link')).toHaveLength(3)
  })
})
