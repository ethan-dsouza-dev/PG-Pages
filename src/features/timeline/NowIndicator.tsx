import { format } from 'date-fns'
import type { TimelineWindow } from '../../domain/timeline'
import { TIMELINE } from './layout'
import type { TimeScale } from './types'
import { useNow } from './useNow'

type NowIndicatorProps = {
  scale: TimeScale
  window: TimelineWindow
  height: number
}

/** The red "now" line. Owns its own clock so the minute tick re-renders only this. */
export function NowIndicator({ scale, window, height }: NowIndicatorProps) {
  const now = useNow()
  if (now < window.start || now >= window.end) return null

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
