import type { CSSProperties } from 'react'
import { phaseSegments } from '../../domain/phaseSegments'
import type { BoardItem } from '../../domain/types'
import { cx, PhaseBar } from '../../ui'

type BoardChipProps = {
  item: BoardItem
  onToggle: (itemId: string) => void
  className?: string
  /** Grid placement from the group. */
  style?: CSSProperties
}

const statusClass: Record<BoardItem['status'], string> = {
  todo: 'bg-goal-todo',
  // The outline stays yellow on every board theme, Leisure included.
  done: 'bg-goal-done inset-ring-2 inset-ring-task-done-outline',
  inactive: 'bg-board-item-inactive',
}

/** Accessible name: the full title, then ", N phases" and ", inactive" when they apply. */
function boardChipName(item: BoardItem): string {
  const parts = [item.title]
  const phaseCount = item.phases?.length ?? 0
  if (phaseCount > 0) parts.push(`${phaseCount} phase${phaseCount === 1 ? '' : 's'}`)
  if (item.status === 'inactive') parts.push('inactive')
  return parts.join(', ')
}

/**
 * A board item, the same size and colors as a goal chip. Clicking toggles
 * todo ↔ done; inactive items (OQ-16) are aria-disabled and do nothing.
 * Items with phases add a decorative phase strip along their bottom half.
 */
export function BoardChip({ item, onToggle, className, style }: BoardChipProps) {
  const inactive = item.status === 'inactive'
  const segments = item.span && item.phases?.length ? phaseSegments(item.span, item.phases) : []
  const hasStrip = (item.phases?.length ?? 0) > 0

  return (
    <button
      type="button"
      title={item.title}
      aria-label={boardChipName(item)}
      aria-pressed={inactive ? undefined : item.status === 'done'}
      aria-disabled={inactive || undefined}
      onClick={inactive ? undefined : () => onToggle(item.id)}
      style={style}
      className={cx(
        'interactive relative z-2 flex w-full min-w-0 flex-col overflow-hidden rounded-chip text-label font-medium text-text-on-accent',
        statusClass[item.status],
        className,
      )}
    >
      {hasStrip ? (
        <>
          <span className="flex h-7 w-full items-center justify-center truncate px-3 leading-none">
            <span className="truncate">{item.title}</span>
          </span>
          {/* TODO(OQ-1): the green tick, white tick, and white end cap markers on
              phase strips are undecided. Render them here once defined. */}
          <PhaseBar segments={segments} className="h-4.5 w-full" />
        </>
      ) : (
        <span className="block w-full truncate px-4 py-2.5 text-center">{item.title}</span>
      )}
    </button>
  )
}
