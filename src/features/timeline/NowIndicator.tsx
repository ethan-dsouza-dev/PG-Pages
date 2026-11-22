import { format } from 'date-fns'
import { isTimeVisible, type TimelineWindow } from '../../domain/timeline'
import type { HourRange } from '../../domain/types'
import { TIMELINE } from './layout'
import type { TimeScale } from './types'
import { useNow } from './useNow'

type NowIndicatorProps = {
  scale: TimeScale
  window: TimelineWindow
  hours: HourRange
  height: number
}

/**
 * The red "now" line. Owns its own clock so the minute tick re-renders only this.
 * Hidden (not clamped) while the current time is outside the visible hours:
 * pinned to a day edge it would point at the wrong time.
 */
export function NowIndicator({ scale, window, hours, height }: NowIndicatorProps) {
  const now = useNow()
  if (!isTimeVisible(now, window, hours)) return null

  return (
    <rect
      aria-hidden="true"
      data-testid="now-indicator"
      x={scale(now) - TIMELINE.nowWidth / 2}
      y={0}
      width={TIMELINE.nowWidth}
      height={height}
      className="pointer-events-none fill-now"
    />
  )
}

/** Screen-reader text for the current time. Not a live region: a minutely announcement is noise. */
export function CurrentTimeText() {
  const now = useNow()
  return <span className="sr-only">Current time {format(now, 'h:mm a')}</span>
}
