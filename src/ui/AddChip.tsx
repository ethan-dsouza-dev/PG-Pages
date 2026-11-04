import { cx } from './cx'
import { ComingSoonHint } from './ComingSoonHint'
import { logPlaceholder, placeholderAttrs } from './placeholder'

type AddChipProps = {
  /** Accessible name, e.g. "Add day goal". The visible text is always "+". */
  label: string
  /** `bar`: a full-width, thin-bordered bar, e.g. a board's add-group control. */
  size?: 'chip' | 'compact' | 'bar'
  className?: string
} & ({ onClick: () => void; placeholder?: never } | { placeholder: true; onClick?: never })

const sizeClass = {
  chip: 'w-full border-2 py-2',
  compact: 'w-24 border-2 py-1.5',
  bar: 'w-full border py-2.5',
} as const

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
        'interactive rounded-add border-border-strong bg-add text-label text-text-on-accent',
        sizeClass[size],
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
