import { cx } from './cx'
import { ComingSoonHint } from './ComingSoonHint'
import { logPlaceholder, placeholderAttrs } from './placeholder'

type SeeAllButtonProps = {
  /** Total number of items behind the control. */
  count: number
  /** Accessible name, e.g. "See all 22 Productivity items in Low Day Productivity". */
  label: string
  className?: string
}

/**
 * A tiny "=" icon over "See all" and the count. Placeholder only: what it opens
 * is OQ-14.
 */
export function SeeAllButton({ count, label, className }: SeeAllButtonProps) {
  // PLACEHOLDER(09): See all (OQ-14: expand in place, modal, or navigate?)
  return (
    <button
      type="button"
      {...placeholderAttrs}
      onClick={() => logPlaceholder(label)}
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
        <ComingSoonHint />
      </span>
    </button>
  )
}
