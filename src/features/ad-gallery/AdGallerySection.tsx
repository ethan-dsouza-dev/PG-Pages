import { useGalleryAds } from '../../store/pgPageStore'
import { GalleryWall } from './GalleryWall'

const HEADING_ID = 'ad-gallery-heading'

/**
 * Ads hung as framed pictures on a grey wall, between a teal ceiling and floor
 * band that belong to this section only (OQ-13). The "Sponsored" heading is
 * visually hidden (OQ-11); each ad's accessible name repeats the disclosure.
 */
export function AdGallerySection() {
  const ads = useGalleryAds()

  return (
    <section aria-labelledby={HEADING_ID}>
      <h2 id={HEADING_ID} className="sr-only">
        Sponsored
      </h2>
      <div aria-hidden="true" className="h-gallery-trim bg-surface-gallery-trim" />
      <GalleryWall ads={ads} />
      <div aria-hidden="true" className="h-gallery-trim bg-surface-gallery-trim" />
    </section>
  )
}
