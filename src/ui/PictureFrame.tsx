import type { CSSProperties, ReactNode } from 'react'
import { cx } from './cx'

type PictureFrameProps = {
  /** The picture, usually an `<img>`. It is stretched to fill the frame's opening. */
  children: ReactNode
  /** Width over height of the picture. The opening keeps this shape before the image loads. */
  aspectRatio: number
  /** Optional line set just above the frame, aligned with the picture's left edge. */
  caption?: ReactNode
  className?: string
}

/**
 * A plain picture frame: a thick `--frame-border` in the frame color, no mat,
 * square corners. Knows nothing about what it holds. Size it from outside by
 * setting its width; the height follows from `aspectRatio`.
 */
export function PictureFrame({ children, aspectRatio, caption, className }: PictureFrameProps) {
  return (
    <figure className={cx('relative m-0', className)}>
      {caption != null && (
        <figcaption className="absolute inset-x-(--frame-border) bottom-full mb-2 font-caption text-caption text-text-caption">
          {caption}
        </figcaption>
      )}
      <div className="border-(length:--frame-border) border-frame bg-frame">
        {/* The opening, not the border box, carries the picture's shape. */}
        <div
          className="overflow-hidden *:block *:size-full *:object-cover"
          style={{ aspectRatio } satisfies CSSProperties}
        >
          {children}
        </div>
      </div>
    </figure>
  )
}
