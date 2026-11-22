import { useId } from 'react'
import { calendarDate } from '../../domain/todaySplit'
import { useBoard, useBoardActions, useBoardItems, useCategories, usePageMeta } from '../../store/pgPageStore'
import { useNow } from '../timeline/useNow'
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
  const { timeZone } = usePageMeta()
  const today = calendarDate(useNow(), timeZone)
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
          today={today}
        />
      </div>
    </section>
  )
}
