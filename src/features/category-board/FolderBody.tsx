import { useId, type MouseEvent } from 'react'
import { placeItems } from '../../domain/boards'
import { splitByToday } from '../../domain/todaySplit'
import type { BoardGroup } from '../../domain/types'
import { cx } from '../../ui'
import type { BoardScope } from './BoardGroup'
import { isFromControl } from './clicks'
import { isLeaf } from './folderPath'
import { AddToFolderButton } from './AddToFolderButton'
import { ItemBand } from './ItemBand'

type FolderBodyProps = {
  group: BoardGroup
  scope: BoardScope
  /** Group ids from the top level down to this group. */
  path: readonly string[]
  /**
   * `open`: the folder the user is in; everything shown, nothing capped.
   * `child`: a folder inside the open one, capped (LP-7.5) and clickable to open.
   */
  role: 'open' | 'child'
  /** Capped at --folder-child-max-height, overflow hidden (LP-7.5). */
  capped?: boolean
  /** Nesting inside the view's outermost folder box. */
  depth?: number
}

const HEADING_TAGS = ['h3', 'h4', 'h5', 'h6'] as const

/**
 * A folder in the drill-down views (LP-7.5–7.9): its title, today's items
 * inside the black outline, everything else below, then its child folders.
 * Children of the open folder are capped and open on click; deeper ones sit
 * inside their capped parent and open on click too.
 */
export function FolderBody({ group, scope, path, role, capped = false, depth = 0 }: FolderBodyProps) {
  const headingId = useId()
  const { board, boardName, laneNames, items, onToggleItem, today, onOpen } = scope
  const isOpen = role === 'open'
  const placed = placeItems(board, group, items)
  const primary = splitByToday(placed.primary, today)
  const lanes = board.overlapCategoryIds.map((id) => ({ id, name: laneNames[id], ...splitByToday(placed.lanes[id], today) }))
  const todayCount = primary.today.length + lanes.reduce((n, l) => n + l.today.length, 0)
  const restCount = primary.rest.length + lanes.reduce((n, l) => n + l.rest.length, 0)
  const Heading = HEADING_TAGS[Math.min(depth, HEADING_TAGS.length - 1)]
  const open = () => onOpen(path)

  const handleClick = isOpen
    ? undefined
    : (event: MouseEvent) => {
        if (isFromControl(event)) return
        event.stopPropagation()
        open()
      }

  return (
    <div
      role="group"
      aria-labelledby={headingId}
      data-board-group={group.id}
      data-current-folder={isOpen ? '' : undefined}
      data-folder-leaf={isLeaf(group) ? '' : undefined}
      onClick={handleClick}
      className={cx(
        'col-span-full grid grid-cols-subgrid content-start gap-y-(--board-row-gap) rounded-(--group-radius) border-(length:--group-ring-width) border-group-ring bg-group-panel bg-clip-padding py-(--group-pad-block)',
        isOpen ? 'cursor-auto' : 'cursor-zoom-in',
        depth > 0 && 'mx-(--group-nest-inset)',
        capped && 'max-h-(--folder-child-max-height) overflow-hidden',
      )}
    >
      <div className="relative z-2 col-[primary-start/primary-end] flex min-w-0 items-end gap-3">
        <div className="flex min-w-0 flex-col">
          {group.note && <p className="text-caption">{group.note}</p>}
          <div className="flex min-w-0 items-center gap-2">
            <Heading id={headingId} className="font-body text-group font-medium break-words">
              {group.title}
            </Heading>
            <AddToFolderButton folderId={group.id} title={group.title} />
          </div>
        </div>
        {!isOpen && (
          <button
            type="button"
            data-open-folder={group.id}
            aria-label={`Open ${group.title}`}
            onClick={open}
            className="interactive shrink-0 rounded-chip px-2 py-1 text-label underline underline-offset-2"
          >
            Open <span aria-hidden="true">›</span>
          </button>
        )}
      </div>

      {todayCount === 0 && restCount === 0 && (
        <p className={cx('col-[primary-start/primary-end] text-caption', !isOpen && 'sr-only')}>No items</p>
      )}

      {todayCount > 0 && (
        <ItemBand
          label="On today's schedule"
          boardName={boardName}
          primary={primary.today}
          lanes={lanes.map((l) => ({ id: l.id, name: l.name, items: l.today }))}
          outlined
          onToggleItem={onToggleItem}
        />
      )}
      {restCount > 0 && (
        <ItemBand
          label={todayCount > 0 ? 'Not on today’s schedule' : 'Items'}
          boardName={boardName}
          primary={primary.rest}
          lanes={lanes.map((l) => ({ id: l.id, name: l.name, items: l.rest }))}
          onToggleItem={onToggleItem}
        />
      )}

      {group.children?.map((child) => (
        <FolderBody
          key={child.id}
          group={child}
          scope={scope}
          path={[...path, child.id]}
          role="child"
          capped={isOpen}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}
