import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react'
import type { Board as BoardData, BoardItem, Category, CategoryId } from '../../domain/types'
import { AddChip, cx } from '../../ui'
import { BoardGroup, type BoardScope } from './BoardGroup'
import { isFromControl } from './clicks'
import { FolderBody } from './FolderBody'
import { CATEGORY, parentPath, resolveFolderPath, ROOT, type FolderPath } from './folderPath'
import { BOARD, boardColumns, laneLines } from './layout'
import { OverlapLane } from './OverlapLane'

export type BoardProps = {
  board: BoardData
  categories: Readonly<Record<CategoryId, Category>>
  items: Readonly<Record<string, BoardItem>>
  onToggleItem: (itemId: string) => void
  /** Id for the board's `<h2>`, so the enclosing section can be labelled by it. */
  headingId: string
  /** Today's calendar date ('YYYY-MM-DD') in the page time zone (LP-7.8). */
  today: string
  /** Where the board starts. Defaults to the root view. */
  initialPath?: FolderPath
}

const navButtonClass =
  'interactive shrink-0 rounded-chip px-2 py-1 font-body text-label font-medium underline underline-offset-2'

/**
 * A category board: an outer ring around a pale inner panel holding the title
 * row, the groups, and the add-group bar, with one translucent band per overlap
 * lane. Entirely driven by `board` and its category's theme (09a).
 *
 * Drill-down (LP-7.4–7.7): the root view is capped and opens the category on
 * click; inside, child folders are capped and open on click; a leaf shows
 * everything. Only the open folder's contents scroll. "Up", the breadcrumb,
 * Escape, or a click on the box around the open folder go back up.
 */
export function Board({ board, categories, items, onToggleItem, headingId, today, initialPath = ROOT }: BoardProps) {
  const category = categories[board.categoryId]
  const [path, setPath] = useState<FolderPath>(initialPath)
  const trail = resolveFolderPath(board, path)
  const view = trail === null ? 'root' : trail.length === 0 ? 'category' : 'group'
  const current = trail?.at(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  /** After a move, focus the card of the folder we came out of (going up), else the nav button. */
  const pendingFocus = useRef<{ from: string | null } | null>(null)

  const navigate = (next: FolderPath) => {
    const goingUp = next === null || (path !== null && next.length < path.length)
    pendingFocus.current = { from: goingUp && next !== null && path !== null ? path[next.length] : null }
    setPath(next)
  }
  const up = () => {
    if (view !== 'root') navigate(parentPath(path))
  }

  useEffect(() => {
    const pending = pendingFocus.current
    const root = containerRef.current
    if (!pending || !root) return
    pendingFocus.current = null
    scrollRef.current?.scrollTo?.({ top: 0 })
    const cards = [...root.querySelectorAll<HTMLElement>('[data-open-folder]')]
    const target =
      cards.find((el) => el.dataset.openFolder === pending.from) ?? root.querySelector<HTMLElement>('[data-board-nav]')
    target?.focus()
    root.scrollIntoView?.({ block: 'nearest' })
  }, [path])

  const laneCount = board.overlapCategoryIds.length
  const laneNames = Object.fromEntries(board.overlapCategoryIds.map((id) => [id, categories[id]?.name ?? id]))
  const scope: BoardScope = {
    board,
    boardName: category.name,
    laneNames,
    items,
    onToggleItem,
    today,
    onOpen: (next) => navigate(next),
  }

  const handlePanelClick = (event: MouseEvent<HTMLDivElement>) => {
    if (isFromControl(event)) return
    if (view === 'root') return navigate(CATEGORY)
    // Clicks inside the open folder stay there; the box around it goes up (LP-7.7).
    if ((event.target as Element).closest('[data-current-folder]')) return
    up()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape' || view === 'root') return
    // Escape inside a chip's menu (a portal) closes the menu, not the folder.
    if (!event.currentTarget.contains(event.target as Node)) return
    event.preventDefault()
    event.stopPropagation()
    up()
  }

  const upLabel =
    view === 'category'
      ? 'Up to all categories'
      : `Up to ${trail && trail.length > 1 ? trail[trail.length - 2].title : category.name}`

  return (
    <div ref={containerRef} data-board-theme={category.theme} data-board-view={view} className="@container" onKeyDown={handleKeyDown}>
      <div
        onClick={handlePanelClick}
        className={cx(
          'relative grid content-start gap-x-(--board-column-gap) gap-y-(--board-gap) rounded-(--board-radius) border-(length:--board-ring-width) border-board-ring bg-board-panel bg-clip-padding p-(--board-pad)',
          view === 'root' ? 'max-h-(--board-root-max-height) cursor-zoom-in overflow-hidden' : 'cursor-zoom-out',
        )}
        style={
          {
            gridTemplateColumns: boardColumns(laneCount),
            '--board-column-gap': `${BOARD.columnGapCqi}cqi`,
            '--board-row-gap': `${BOARD.rowGapCqi}cqi`,
          } as CSSProperties
        }
      >
        {board.overlapCategoryIds.map((id, i) => (
          <OverlapLane key={id} index={i} laneCount={laneCount} />
        ))}

        {view === 'root' ? (
          <div className="relative z-2 col-[edge-start/primary-end] row-start-1 flex items-end gap-3 self-end pl-(--board-pad)">
            <h2 id={headingId} className="font-display text-section font-bold">
              {category.name}
            </h2>
            <button
              type="button"
              data-board-nav=""
              aria-label={`Open ${category.name}`}
              onClick={() => navigate(CATEGORY)}
              className={navButtonClass}
            >
              Open <span aria-hidden="true">›</span>
            </button>
          </div>
        ) : (
          <nav
            aria-label={`${category.name} folder path`}
            className="relative z-2 col-[edge-start/primary-end] row-start-1 flex min-w-0 items-end gap-3 self-end pl-(--board-pad)"
          >
            <button type="button" data-board-nav="" aria-label={upLabel} onClick={up} className={navButtonClass}>
              <span aria-hidden="true">↑</span> Up
            </button>
            <ol className="flex min-w-0 flex-wrap items-baseline gap-x-2">
              <li>
                <h2 id={headingId} className="font-display text-section font-bold">
                  {view === 'category' ? (
                    <span aria-current="location">{category.name}</span>
                  ) : (
                    <button type="button" onClick={() => navigate(CATEGORY)} className="interactive">
                      {category.name}
                    </button>
                  )}
                </h2>
              </li>
              {trail?.map((group, i) => {
                const isCurrent = i === trail.length - 1
                return (
                  <li key={group.id} className="flex items-baseline gap-x-2 font-body text-group font-medium">
                    <span aria-hidden="true">›</span>
                    {isCurrent ? (
                      <span aria-current="location">{group.title}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate(trail.slice(0, i + 1).map((g) => g.id))}
                        className="interactive underline underline-offset-2"
                      >
                        {group.title}
                      </button>
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
        )}
        {board.overlapCategoryIds.map((id, i) => {
          const lines = laneLines(i)
          return (
            <p
              key={id}
              aria-hidden="true"
              className="relative z-2 row-start-1 self-end font-body text-label font-medium"
              style={{ gridColumn: `${lines.itemStart} / ${lines.end}` }}
            >
              {laneNames[id]}
            </p>
          )
        })}

        {view === 'root' ? (
          <>
            {board.groups.map((group) => (
              <BoardGroup key={group.id} group={group} scope={scope} />
            ))}
            <AddGroupBar name={category.name} />
          </>
        ) : (
          <div
            ref={scrollRef}
            data-folder-scroll=""
            className="col-span-full grid auto-rows-max grid-cols-subgrid content-start gap-y-(--board-gap) overflow-x-hidden overflow-y-auto overscroll-contain max-h-(--board-open-max-height)"
          >
            {view === 'category' ? (
              <>
                {board.groups.map((group) => (
                  <FolderBody key={group.id} group={group} scope={scope} path={[group.id]} role="child" capped />
                ))}
                <AddGroupBar name={category.name} />
              </>
            ) : (
              current && <FolderBody group={current} scope={scope} path={path ?? []} role="open" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AddGroupBar({ name }: { name: string }) {
  return (
    <div className="col-span-full">
      {/* PLACEHOLDER(09): adding groups is out of scope. */}
      <AddChip label={`Add group to ${name}`} size="bar" placeholder />
    </div>
  )
}
