import { adAccessibleName, adAspectRatio } from '../../domain/ads'
import type { Ad } from '../../domain/types'
import { PictureFrame } from '../../ui'
import { frameWidth, hangFrames, WALL } from './layout'

type GalleryWallProps = {
  ads: readonly Ad[]
  /** Called with the slot index when a frame is activated (click, Enter or Space). */
  onOpenAd: (slot: number) => void
  /** Receives each frame's button by slot, so focus can be returned to it. */
  frameRef?: (slot: number, button: HTMLButtonElement | null) => void
  /**
   * PLACEHOLDER(08): impression hook. Will fire when an ad scrolls into view
   * once real ad serving exists (OQ-10). Nothing calls it yet.
   */
  onVisible?: (ad: Ad) => void
}

/** The grey wall with ads hung salon style, per the slots in `layout.ts`. */
export function GalleryWall({ ads, onOpenAd, frameRef }: GalleryWallProps) {
  const hang = hangFrames(ads.length)

  return (
    <div className="bg-surface-gallery-wall">
      <div className="@container mx-auto max-w-page">
        <ul
          className="grid"
          style={{
            height: `${WALL.heightCqi}cqi`,
            gridTemplateColumns: hang.columns,
            justifyContent: hang.justify,
          }}
        >
          {hang.placements.map(({ slot, column }, i) => {
            const ad = ads[i]
            const aspectRatio = adAspectRatio(ad)
            return (
              // Keyed by slot, not ad: swapping the ad keeps the same button, so focus returns to it.
              <li key={i} className="relative row-start-1" style={{ gridColumnStart: column }}>
                <div
                  className="absolute inset-x-0 mx-auto -translate-y-1/2"
                  style={{ top: `${slot.centerY}cqi`, width: frameWidth(aspectRatio) }}
                >
                  <button
                    ref={(button) => frameRef?.(i, button)}
                    type="button"
                    onClick={() => onOpenAd(i)}
                    aria-haspopup="dialog"
                    aria-label={adAccessibleName(ad)}
                    className="group interactive block w-full text-left"
                  >
                    <PictureFrame
                      aspectRatio={aspectRatio}
                      caption={ad.caption}
                      className="motion-safe:transition-[translate,box-shadow] motion-safe:duration-150 motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:shadow-lift"
                    >
                      <img
                        src={ad.image.src}
                        alt={ad.image.alt}
                        width={ad.image.width}
                        height={ad.image.height}
                        loading="lazy"
                        decoding="async"
                      />
                    </PictureFrame>
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
