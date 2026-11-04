import { createTimeScale, type TimelineWindow } from '../../domain/timeline'
import type { Task } from '../../domain/types'
import { rowTop, timelineHeight, TIMELINE } from './layout'
import { NowIndicator } from './NowIndicator'
import { TaskRow } from './TaskRow'
import type { OpenPhaseHandler } from './types'

type TimelineSvgProps = {
  window: TimelineWindow
  rows: Task[][]
  dayWidth: number
  onOpenPhase: OpenPhaseHandler
}

/** Pure render of the 3-day timeline: (window, rows, size) → SVG. */
export function TimelineSvg({ window, rows, dayWidth, onOpenPhase }: TimelineSvgProps) {
  const width = dayWidth * 3
  const height = timelineHeight(rows.length)
  const scale = createTimeScale(window, dayWidth)

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="group"
      aria-label="Tasks from yesterday to tomorrow"
      className="block"
    >
      {window.days.map((day, i) => (
        <rect
          key={day.toISOString()}
          aria-hidden="true"
          x={i * dayWidth}
          y={TIMELINE.overshoot}
          width={dayWidth}
          height={height - 2 * TIMELINE.overshoot}
          className={i === 1 ? 'fill-track-today' : 'fill-track-adjacent'}
        />
      ))}
      {rows.map((tasks, i) => (
        <TaskRow
          key={tasks[0].seriesId ?? tasks[0].id}
          tasks={tasks}
          top={rowTop(i)}
          scale={scale}
          window={window}
          onOpenPhase={onOpenPhase}
        />
      ))}
      <NowIndicator scale={scale} window={window} height={height} />
    </svg>
  )
}
