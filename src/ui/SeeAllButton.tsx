import { cx } from './cx'
import { ComingSoonHint } from './ComingSoonHint'
import { logPlaceholder, placeholderAttrs } from './placeholder'

type SeeAllButtonProps = {
  /** Total number of items behind the control. */
  count: number
  /** Accessible name, e.g. "See all 22 Productivity items in Low Day Productivity". */
  label: string
  className?: string
  /** What it opens. Without one it renders as a placeholder. */
  onClick?: () => void
}

/**
 * A tiny "=" icon over "See all" and the count. On boards it drills into the
 * group (LP-7.4–7.7, answering OQ-14); without `onClick` it is a placeholder.
 */
export function SeeAllButton({ count, label, className, onClick }: SeeAllButtonProps) {
  const isPlaceholder = onClick === undefined
  return (
    <button
      type="button"
      {...(isPlaceholder ? placeholderAttrs : {})}
      onClick={onClick ?? (() => logPlaceholder(label))}
      className={cx('interactive flex flex-col items-start gap-0.5 text-left text-caption leading-tight whitespace-nowrap', className)}
    >
      <span aria-hidden="true" className="flex w-6 flex-col gap-1 pb-1">
        <span className="h-1 rounded-full bg-text" />
        <span className="h-1 rounded-full bg-text" />
      </span>
      <span aria-hidden="true">See all</span>
      <span aria-hidden="true" className="text-[0.75em]">
        {count}
      </span>
      <span className="sr-only">
        {label}
        {isPlaceholder && <ComingSoonHint />}
      </span>
    </button>
  )
}
