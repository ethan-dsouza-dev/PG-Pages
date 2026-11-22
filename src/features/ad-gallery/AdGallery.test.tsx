import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCK_ADS } from '../../data/mock/ads'
import { adAccessibleName } from '../../domain/ads'
import type { Ad } from '../../domain/types'
import { usePGPageStore } from '../../store/pgPageStore'
import { AdGallerySection } from './AdGallerySection'
import { GalleryWall } from './GalleryWall'
import { hangFrames, WALL } from './layout'

const withCaption = MOCK_ADS.find((a) => a.caption) as Ad
const withoutCaption = MOCK_ADS.filter((a) => !a.caption)
const noop = () => {}

describe('GalleryWall', () => {
  it.each([1, 2, 3])('hangs %i ad(s) as buttons in order', (count) => {
    const ads = MOCK_ADS.slice(0, count)
    render(<GalleryWall ads={ads} onOpenAd={noop} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(count)
    buttons.forEach((button, i) => {
      expect(button).toHaveAccessibleName(adAccessibleName(ads[i]))
      expect(button).toHaveAttribute('aria-haspopup', 'dialog')
    })
  })

  it('names each ad as an advertisement, with the caption when there is one', () => {
    render(<GalleryWall ads={[withoutCaption[0], withCaption]} onOpenAd={noop} />)
    expect(
      screen.getByRole('button', { name: `Advertisement: ${withoutCaption[0].advertiser}` }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: `Advertisement: ${withCaption.advertiser}, ${withCaption.caption}` }),
    ).toBeInTheDocument()
  })

  it('shows a caption only when the ad has one', () => {
    const { container, rerender } = render(<GalleryWall ads={[withCaption]} onOpenAd={noop} />)
    expect(container.querySelectorAll('figcaption')).toHaveLength(1)
    expect(screen.getByText(withCaption.caption as string)).toBeInTheDocument()

    rerender(<GalleryWall ads={withoutCaption.slice(0, 3)} onOpenAd={noop} />)
    expect(container.querySelectorAll('figcaption')).toHaveLength(0)
  })

  it('reports the slot of the frame that was activated, by click, Enter or Space', async () => {
    const user = userEvent.setup()
    const onOpenAd = vi.fn()
    render(<GalleryWall ads={MOCK_ADS.slice(0, 3)} onOpenAd={onOpenAd} />)
    const [, second, third] = screen.getAllByRole('button')
    await user.click(second)
    third.focus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(onOpenAd.mock.calls).toEqual([[1], [2], [2]])
  })

  it('reserves each image size and loads it lazily', () => {
    const ad = MOCK_ADS[0]
    render(<GalleryWall ads={[ad]} onOpenAd={noop} />)
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
  const [first, second, third, spare] = MOCK_ADS

  beforeEach(() => {
    usePGPageStore.setState({ adPool: MOCK_ADS, galleryAds: [first, second, third] })
  })

  it('is a section labelled by a visually hidden "Sponsored" heading', () => {
    render(<AdGallerySection />)
    const section = screen.getByRole('region', { name: 'Sponsored' })
    expect(screen.getByRole('heading', { level: 2, name: 'Sponsored' })).toHaveClass('sr-only')
    expect(within(section).getAllByRole('button')).toHaveLength(3)
  })

  it('opens an ad popup, changes the ad, and closes back to the same frame', async () => {
    const user = userEvent.setup()
    // Only one ad is off the wall, so the replacement is known.
    usePGPageStore.setState({ adPool: [first, second, third, spare] })
    render(<AdGallerySection />)

    await user.click(screen.getByRole('button', { name: adAccessibleName(second) }))

    let dialog = screen.getByRole('dialog', { name: second.advertiser })
    expect(dialog).toHaveAccessibleDescription(second.description)
    expect(within(dialog).getByRole('img', { name: second.image.alt })).toHaveAttribute('src', second.image.src)
    const visit = within(dialog).getByRole('link', { name: `Visit ${second.advertiser}, opens in a new tab` })
    expect(visit).toHaveAttribute('href', second.advertiserUrl)
    expect(visit).toHaveAttribute('target', '_blank')
    expect(visit).toHaveAttribute('rel', 'noopener noreferrer')

    await user.click(within(dialog).getByRole('button', { name: 'Change ad' }))

    // The popup follows the slot, so it now shows the replacement.
    dialog = screen.getByRole('dialog', { name: spare.advertiser })
    expect(within(dialog).getByRole('link', { name: /^Visit / })).toHaveAttribute('href', spare.advertiserUrl)
    expect(usePGPageStore.getState().galleryAds.map((a) => a.id)).toEqual([first.id, spare.id, third.id])

    await user.click(within(dialog).getByRole('button', { name: 'Close' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // Radix returns focus on the next tick.
    await waitFor(() => expect(screen.getByRole('button', { name: adAccessibleName(spare) })).toHaveFocus())
    expect(screen.queryByRole('button', { name: adAccessibleName(second) })).not.toBeInTheDocument()
  })

  it('disables "Change ad" when every ad in the pool is already on the wall', async () => {
    const user = userEvent.setup()
    usePGPageStore.setState({ adPool: [first, second, third] })
    render(<AdGallerySection />)
    await user.click(screen.getByRole('button', { name: adAccessibleName(third) }))
    expect(screen.getByRole('button', { name: 'Change ad' })).toBeDisabled()
  })

  it('closes on Escape without changing the wall', async () => {
    const user = userEvent.setup()
    render(<AdGallerySection />)
    await user.click(screen.getByRole('button', { name: adAccessibleName(first) }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(usePGPageStore.getState().galleryAds).toEqual([first, second, third])
  })
})
