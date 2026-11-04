import { useId, useState } from 'react'
import { MOCK_BOARDS } from '../data/mock/boards'
import { toggleBoardItem } from '../domain/boards'
import type { Board as BoardData, BoardItem } from '../domain/types'
import { Board } from '../features/category-board/Board'
import { EDGE_BOARDS, MATRIX_BOARDS, PREVIEW_CATEGORIES, PREVIEW_ITEMS, THEME_SWAP_BOARD } from './boardVariants'

type PreviewProps = {
  label: string
  board: BoardData
  items: Record<string, BoardItem>
  onToggleItem: (id: string) => void
}

function PreviewBoard({ label, board, items, onToggleItem }: PreviewProps) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <p className="text-meta">{label}</p>
      <Board board={board} categories={PREVIEW_CATEGORIES} items={items} onToggleItem={onToggleItem} headingId={headingId} />
    </section>
  )
}

/** Dev-only page (`/?boards`): the real boards, the 09a variant matrix, and edge cases. */
export default function BoardsPreview() {
  const [items, setItems] = useState(PREVIEW_ITEMS)
  const onToggleItem = (id: string) => setItems((current) => toggleBoardItem(current, id))
  const realBoards = MOCK_BOARDS.map((board) => ({
    label: `${PREVIEW_CATEGORIES[board.categoryId].theme} · page fixture`,
    board,
  }))

  const groups = [
    { title: 'Page boards', boards: realBoards },
    { title: 'Matrix: theme × lanes', boards: MATRIX_BOARDS },
    { title: 'Edge cases', boards: [...EDGE_BOARDS, THEME_SWAP_BOARD] },
  ]

  return (
    <main className="mx-auto flex max-w-page flex-col gap-section-gap px-16 py-section-gap">
      <h1 className="font-display text-title">Boards preview</h1>
      {groups.map(({ title, boards }) => (
        <div key={title} className="flex flex-col gap-section-gap">
          <p className="border-b border-border-strong pb-2 font-display text-section font-bold">{title}</p>
          {boards.map(({ label, board }) => (
            <PreviewBoard key={board.id} label={label} board={board} items={items} onToggleItem={onToggleItem} />
          ))}
        </div>
      ))}
    </main>
  )
}
