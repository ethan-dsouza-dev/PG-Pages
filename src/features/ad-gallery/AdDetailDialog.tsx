import * as Dialog from '@radix-ui/react-dialog'
import { adAspectRatio } from '../../domain/ads'
import type { Ad } from '../../domain/types'
import { PictureFrame, TextLink } from '../../ui'

type AdDetailDialogProps = {
  /** The ad to show, or `null` when the popup is closed. */
  ad: Ad | null
  onClose: () => void
  /** Swaps this ad's gallery slot for another ad (LP-8.2). */
  onChangeAd: () => void
  /** False when every ad in the pool is already on the wall. */
  canChangeAd: boolean
  /** Called instead of Radix's default focus return, which loses the frame when no Trigger is used. */
  onCloseAutoFocus: (event: Event) => void
}

/**
 * The popup behind a framed ad (LP-8.1): a larger picture, the advertiser's
 * description, a link to their site, and a "Change ad" button (LP-8.2).
 * Radix traps focus and closes on Escape or an outside click; the caller
 * returns focus to the frame that opened it.
 */
export function AdDetailDialog({ ad, onClose, onChangeAd, canChangeAd, onCloseAutoFocus }: AdDetailDialogProps) {
  return (
    <Dialog.Root open={ad !== null} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-overlay" />
        <Dialog.Content
          onCloseAutoFocus={onCloseAutoFocus}
          className="fixed top-1/2 left-1/2 flex max-h-[90vh] w-160 max-w-[90vw] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-panel border-2 border-border-strong bg-surface-panel p-8 font-body text-text"
        >
          {ad && (
            <>
              <div>
                <p className="text-caption tracking-wide uppercase">Sponsored</p>
                <Dialog.Title className="text-section">{ad.advertiser}</Dialog.Title>
                {ad.caption && <p className="font-caption text-meta">{ad.caption}</p>}
              </div>
              {/* A size container, so the frame border scales with the popup like it does on the wall. */}
              <div className="@container">
                {/* Tall pictures are capped by height so the popup still fits the viewport. */}
                <div className="mx-auto" style={{ width: `min(100%, calc(55vh * ${+adAspectRatio(ad).toFixed(4)}))` }}>
                  <PictureFrame aspectRatio={adAspectRatio(ad)}>
                    <img src={ad.image.src} alt={ad.image.alt} width={ad.image.width} height={ad.image.height} />
                  </PictureFrame>
                </div>
              </div>
              <Dialog.Description className="text-meta">{ad.description}</Dialog.Description>
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <TextLink size="label" href={ad.advertiserUrl} external>
                  {`Visit ${ad.advertiser}`}
                </TextLink>
                <div className="flex gap-6">
                  <TextLink size="label" onClick={onChangeAd} disabled={!canChangeAd}>
                    Change ad
                  </TextLink>
                  <TextLink size="label" onClick={onClose}>
                    Close
                  </TextLink>
                </div>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
