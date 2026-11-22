import { useId, useRef, type KeyboardEvent } from 'react'
import { clampToWindow, type TimelineWindow } from '../../domain/timeline'
import { describeSpan } from '../../domain/timelineFormat'
import type { Phase, Task } from '../../domain/types'
import { usePGPageActions, useTaskWindowActions } from '../../store/pgPageStore'
import { cx } from '../../ui'
import { TIMELINE } from './layout'
import { focusTimelineScroller, isContextMenuKey, openContextMenuFromKeyboard } from './contextMenuKeys'
import { TaskContextMenu } from './TaskContextMenu'
import type { OpenPhaseHandler, RequestDeleteHandler, TimeScale } from './types'

type RowGeometry = {
  top: number
  scale: TimeScale
  window: TimelineWindow
}

type TaskRowProps = RowGeometry & {
  /** One task, or every instance of a repeating series. */
  tasks: Task[]
  onOpenPhase: OpenPhaseHandler
  onRequestDelete: RequestDeleteHandler
}

/** Enter/Space activation for SVG elements acting as buttons. */
function activateOnKey(action: () => void) {
  return (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      action()
    }
  }
}

const focusableSvg = 'cursor-pointer outline-none transition-[filter] motion-reduce:transition-none'

export function TaskRow({ tasks, onOpenPhase, onRequestDelete, ...geometry }: TaskRowProps) {
  const { toggleTask, unscheduleTask } = usePGPageActions()
  return (
    <g>
      {tasks.map((task) => (
        <TaskBar
          key={task.id}
          task={task}
          onToggle={() => toggleTask(task.id)}
          onRemove={() => unscheduleTask(task.id)}
          onRequestDelete={onRequestDelete}
          onOpenPhase={onOpenPhase}
          {...geometry}
        />
      ))}
    </g>
  )
}

type TaskBarProps = RowGeometry & {
  task: Task
  onToggle: () => void
  onRemove: () => void
  onRequestDelete: RequestDeleteHandler
  onOpenPhase: OpenPhaseHandler
}

function TaskBar({ task, top, scale, window, onToggle, onRemove, onRequestDelete, onOpenPhase }: TaskBarProps) {
  const clipId = useId()
  const barRef = useRef<SVGGElement>(null)
  const span = clampToWindow(task, window)
  if (!span) return null

  const x0 = scale(span.start)
  const x1 = scale(span.end)
  const phases = task.phases ?? []
  const barHeight = phases.length > 0 ? TIMELINE.rowHeight - TIMELINE.phaseHeight : TIMELINE.rowHeight
  // Clipped sides extend past the SVG edge so their rounded corners are cut off square.
  const left = span.startsBefore ? x0 - TIMELINE.barRadius : x0
  const right = span.endsAfter ? x1 + TIMELINE.barRadius : x1
  const status = task.completed ? 'done' : 'to do'

  return (
    <g>
      <TaskContextMenu
        task={task}
        onRemove={() => {
          // The bar leaves the timeline, so park focus on the scroller first.
          focusTimelineScroller(barRef.current)
          onRemove()
        }}
        onRequestDelete={() => barRef.current && onRequestDelete(task, barRef.current)}
      >
        <g
          ref={barRef}
          role="button"
          tabIndex={0}
          aria-pressed={task.completed}
          aria-keyshortcuts="Shift+F10"
          aria-label={`${task.title}, ${describeSpan(task, window)}, ${status}`}
          onClick={onToggle}
          onKeyDown={(event) => {
            if (isContextMenuKey(event)) {
              event.preventDefault()
              openContextMenuFromKeyboard(event.currentTarget)
              return
            }
            activateOnKey(onToggle)(event)
          }}
          className={cx('group hover:brightness-110', focusableSvg)}
        >
          <clipPath id={clipId}>
            <rect x={x0} y={top} width={x1 - x0} height={barHeight} />
          </clipPath>
          <rect
            x={left}
            y={top}
            width={right - left}
            height={barHeight}
            rx={TIMELINE.barRadius}
            strokeWidth={task.completed ? 1.5 : 0}
            className={cx(
              task.completed ? 'fill-task-done stroke-task-done-outline' : 'fill-task-todo',
              'group-focus-visible:stroke-focus-ring-inverse group-focus-visible:[stroke-width:3]',
            )}
          />
          <text
            x={(x0 + x1) / 2}
            y={top + barHeight / 2}
            textAnchor="middle"
            dominantBaseline="central"
            clipPath={`url(#${clipId})`}
            aria-hidden="true"
            className="pointer-events-none fill-text-on-accent font-body text-label font-medium"
          >
            {task.title}
          </text>
        </g>
      </TaskContextMenu>
      {task.milestones?.map((m) => (
        <MilestoneMark
          key={m.id}
          task={task}
          label={m.label}
          at={m.at}
          top={top}
          height={barHeight}
          scale={scale}
          window={window}
        />
      ))}
      {phases.length > 0 && (
        <PhaseStrip
          task={task}
          phases={phases}
          taskTitle={task.title}
          top={top + barHeight}
          scale={scale}
          window={window}
          onOpenPhase={onOpenPhase}
        />
      )}
    </g>
  )
}

type MilestoneMarkProps = RowGeometry & {
  task: Task
  label: string
  at: string
  height: number
}

/** LP-3.13 / TW-3.9: a milestone, a clickable vertical line on its bar that opens the task. */
function MilestoneMark({ task, label, at, top, height, scale, window }: MilestoneMarkProps) {
  const { openTaskWindow } = useTaskWindowActions()
  const time = new Date(at)
  if (time < window.start || time > window.end) return null
  const x = scale(time)
  const open = () => openTaskWindow({ mode: 'edit', kind: 'task', taskId: task.id })
  return (
    <g
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      aria-label={`Milestone ${label} on ${task.title}`}
      onClick={open}
      onKeyDown={activateOnKey(open)}
      className={cx('group', focusableSvg)}
    >
      <title>{label}</title>
      {/* A wider transparent hit area keeps the 2px line easy to click. */}
      <rect x={x - 5} y={top} width={10} height={height} className="fill-transparent" />
      <line
        x1={x}
        x2={x}
        y1={top}
        y2={top + height}
        strokeWidth={2}
        className="pointer-events-none stroke-milestone group-focus-visible:stroke-focus-ring-inverse group-focus-visible:[stroke-width:4]"
      />
    </g>
  )
}

type PhaseStripProps = RowGeometry & {
  task: Task
  phases: Phase[]
  taskTitle: string
  onOpenPhase: OpenPhaseHandler
}

function PhaseStrip({ task, phases, taskTitle, top, scale, window, onOpenPhase }: PhaseStripProps) {
  // TODO(OQ-1): the green tick, white tick, and white end cap markers on phase
  // strips are undecided (specs/briefs/00-README.md). Render them here once defined.
  return (
    <g>
      {phases.map((phase) => {
        const span = clampToWindow(phase, window)
        if (!span) return null
        const x0 = scale(span.start)
        const x1 = scale(span.end)
        return (
          <rect
            key={phase.id}
            role="button"
            tabIndex={0}
            aria-haspopup="dialog"
            aria-label={`${phase.title} phase of ${taskTitle}, ${describeSpan(phase, window)}`}
            x={x0}
            y={top}
            // 1px gap keeps adjacent phases individually visible and clickable.
            width={Math.max(1, x1 - x0 - 1)}
            height={TIMELINE.phaseHeight}
            onClick={() => onOpenPhase(task, phase)}
            onKeyDown={activateOnKey(() => onOpenPhase(task, phase))}
            className={cx(
              'fill-phase hover:brightness-150',
              'focus-visible:stroke-focus-ring-inverse focus-visible:[stroke-width:3]',
              focusableSvg,
            )}
          />
        )
      })}
    </g>
  )
}
