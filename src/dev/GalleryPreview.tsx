import { MOCK_ADS } from '../data/mock/ads'
import type { Ad } from '../domain/types'
import { GalleryWall } from '../features/ad-gallery/GalleryWall'

const byId = (...ids: string[]): Ad[] =>
  ids.map((id) => {
    const ad = MOCK_ADS.find((a) => a.id === id)
    if (!ad) throw new Error(`No mock ad "${id}"`)
    return ad
  })

/** Shape combinations the random pick can produce, plus the partial sets. */
const SETS: { label: string; ads: Ad[] }[] = [
  {
    label: 'Mockup shapes: landscape, portrait, portrait',
    ads: byId('ad-prism-studio', 'ad-westside-museum', 'ad-dusk-trails'),
  },
  { label: 'All landscape', ads: byId('ad-orbit-coffee', 'ad-blockprint-books', 'ad-fieldnote-gardens') },
  { label: 'All portrait', ads: byId('ad-westside-museum', 'ad-dusk-trails', 'ad-ripple-records') },
  {
    label: 'Mixed: square, landscape, portrait',
    ads: byId('ad-canyon-galleries', 'ad-blockprint-books', 'ad-ripple-records'),
  },
  {
    label: 'Mixed: portrait, landscape, landscape',
    ads: byId('ad-ripple-records', 'ad-prism-studio', 'ad-orbit-coffee'),
  },
  { label: 'Two ads (small pool)', ads: byId('ad-prism-studio', 'ad-westside-museum') },
  { label: 'One ad (small pool)', ads: byId('ad-canyon-galleries') },
]

/** Dev-only page (`/?gallery`) hanging every shape combination on the wall. */
export default function GalleryPreview() {
  return (
    <main className="flex flex-col gap-section-gap py-section-gap">
      <h1 className="mx-auto w-full max-w-page px-16 font-display text-title">Gallery preview</h1>
      {SETS.map(({ label, ads }) => (
        <section key={label} aria-label={label}>
          <h2 className="mx-auto mb-4 max-w-page px-16 text-section">{label}</h2>
          <div className="h-gallery-trim bg-surface-gallery-trim" />
          <GalleryWall ads={ads} />
          <div className="h-gallery-trim bg-surface-gallery-trim" />
        </section>
      ))}
    </main>
  )
}
