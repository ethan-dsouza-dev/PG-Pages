import { cx } from './cx'
import { ComingSoonHint } from './ComingSoonHint'
import { logPlaceholder, placeholderAttrs } from './placeholder'

type AddChipProps = {
  /** Accessible name, e.g. "Add day goal". The visible text is always "+". */
  label: string
  size?: 'chip' | 'compact'
  className?: string
} & ({ onClick: () => void; placeholder?: never } | { placeholder: true; onClick?: never })

/** The tan "+" button that ends every chip grid and the timeline panel. */
export function AddChip({ label, size = 'chip', className, ...behavior }: AddChipProps) {
  const isPlaceholder = behavior.placeholder === true

  return (
    <button
      type="button"
      aria-label={isPlaceholder ? undefined : label}
      {...(isPlaceholder ? placeholderAttrs : {})}
      onClick={isPlaceholder ? () => logPlaceholder(label) : behavior.onClick}
      className={cx(
        'interactive rounded-add border-2 border-border-strong bg-add text-label text-text-on-accent',
        size === 'chip' ? 'w-full py-2' : 'w-24 py-1.5',
        className,
      )}
    >
      <span aria-hidden="true">+</span>
      {isPlaceholder && (
        <span className="sr-only">
          {label}
          <ComingSoonHint />
        </span>
      )}
    </button>
  )
}
