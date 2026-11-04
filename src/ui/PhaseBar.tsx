import { cx } from './cx'

export type PhaseBarSegment = {
  id: string
  /** 0..1 */
  startFr: number
  /** 0..1 */
  endFr: number
}

type PhaseBarProps = {
  segments: readonly PhaseBarSegment[]
  className?: string
}

const pct = (fr: number) => `${+(fr * 100).toFixed(3)}%`

/**
 * The dark phase strip drawn under a bar, in HTML. Segments are fractions of the
 * bar's width; adjacent segments are separated by a 1px gap and the strip's right
 * end is rounded. Decorative: callers describe the phases in their own label.
 */
export function PhaseBar({ segments, className }: PhaseBarProps) {
  return (
    <div aria-hidden="true" className={cx('relative overflow-hidden rounded-r-full', className)}>
      {segments.map((s, i) => (
        <span
          key={s.id}
          data-phase-segment=""
          className={cx('absolute inset-y-0 bg-phase', i > 0 && 'border-l border-phase-gap')}
          style={{ left: pct(s.startFr), width: pct(s.endFr - s.startFr) }}
        />
      ))}
    </div>
  )
}
