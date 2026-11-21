import { useRef, useState } from 'react'
import { useCanChangeGalleryAd, useGalleryActions, useGalleryAds } from '../../store/pgPageStore'
import { AdDetailDialog } from './AdDetailDialog'
import { GalleryWall } from './GalleryWall'

const HEADING_ID = 'ad-gallery-heading'

/**
 * Ads hung as framed pictures on a grey wall, between a teal ceiling and floor
 * band that belong to this section only (OQ-13). The "Sponsored" heading is
 * visually hidden (OQ-11); each ad's accessible name repeats the disclosure.
 * Activating a frame opens its popup (LP-8.1), which can swap the ad (LP-8.2).
 */
export function AdGallerySection() {
  const ads = useGalleryAds()
  const canChangeAd = useCanChangeGalleryAd()
  const { changeGalleryAd } = useGalleryActions()
  // The popup follows the slot, so after "Change ad" it shows the new ad.
  const [openSlot, setOpenSlot] = useState<number | null>(null)
  const openAd = openSlot === null ? null : (ads[openSlot] ?? null)
  const frames = useRef<(HTMLButtonElement | null)[]>([])
  const lastSlot = useRef<number | null>(null)

  const open = (slot: number) => {
    lastSlot.current = slot
    setOpenSlot(slot)
  }

  return (
    <section aria-labelledby={HEADING_ID}>
      <h2 id={HEADING_ID} className="sr-only">
        Sponsored
      </h2>
      <div aria-hidden="true" className="h-gallery-trim bg-surface-gallery-trim" />
      <GalleryWall
        ads={ads}
        onOpenAd={open}
        frameRef={(slot, button) => {
          frames.current[slot] = button
        }}
      />
      <div aria-hidden="true" className="h-gallery-trim bg-surface-gallery-trim" />
      <AdDetailDialog
        ad={openAd}
        canChangeAd={canChangeAd}
        onClose={() => setOpenSlot(null)}
        onChangeAd={() => openSlot !== null && changeGalleryAd(openSlot)}
        onCloseAutoFocus={(event) => {
          // Back to the frame that opened the popup, even if its ad was changed.
          const frame = lastSlot.current === null ? null : frames.current[lastSlot.current]
          if (frame) {
            event.preventDefault()
            frame.focus()
          }
        }}
      />
    </section>
  )
}
