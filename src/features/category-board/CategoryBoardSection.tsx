import { useId } from 'react'
import { useBoard, useBoardActions, useBoardItems, useCategories } from '../../store/pgPageStore'
import { Board } from './Board'

/**
 * One board in the page stack: a full-bleed section (the white page surface
 * shows around the board) labelled by the board's title. The board's category
 * decides its theme.
 */
export function CategoryBoardSection({ boardId }: { boardId: string }) {
  const headingId = useId()
  const board = useBoard(boardId)
  const items = useBoardItems()
  const categories = useCategories()
  const { toggleBoardItem } = useBoardActions()
  if (!board) return null

  return (
    <section aria-labelledby={headingId}>
      <div className="mx-auto max-w-page px-16">
        <Board
          board={board}
          categories={categories}
          items={items}
          onToggleItem={toggleBoardItem}
          headingId={headingId}
        />
      </div>
    </section>
  )
}
