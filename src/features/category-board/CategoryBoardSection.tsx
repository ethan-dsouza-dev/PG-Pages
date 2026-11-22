import { useId, useMemo, useState, type ReactElement } from 'react'
import { boardItemsFromTasks, representativeTask, tasksForKey } from '../../domain/boardTasks'
import { calendarDate } from '../../domain/todaySplit'
import {
  useBoard,
  useBoardActions,
  useCategories,
  usePageMeta,
  usePGPageActions,
  useTaskWindowActions,
  useTasks,
} from '../../store/pgPageStore'
import { ConfirmDialog } from '../task-window/ConfirmDialog'
import { TaskContextMenu } from '../timeline/TaskContextMenu'
import { useNow } from '../timeline/useNow'
import { Board } from './Board'
import { BoardActionsContext, type BoardActions } from './boardActions'

/**
 * One board in the page stack: a full-bleed section (the white page surface
 * shows around the board) labelled by the board's title. The board's category
 * decides its theme.
 */
export function CategoryBoardSection({ boardId }: { boardId: string }) {
  const headingId = useId()
  const board = useBoard(boardId)
  const tasks = useTasks()
  const categories = useCategories()
  const { toggleBoardItem, deleteSeries } = useBoardActions()
  const { unscheduleTask } = usePGPageActions()
  const { openTaskWindow } = useTaskWindowActions()
  const { timeZone } = usePageMeta()
  const today = calendarDate(useNow(), timeZone)
  // TW-OQ-1: board chips are the page's tasks, grouped by folder.
  const items = useMemo(() => boardItemsFromTasks(tasks, today, timeZone), [tasks, today, timeZone])
  const [pendingDelete, setPendingDelete] = useState<{ key: string; title: string; count: number } | null>(null)

  const actions: BoardActions = {
    // LP-7.10: the task menu acts on the occurrence the chip stands for.
    wrapChip: (key: string, chip: ReactElement) => {
      const series = tasksForKey(tasks, key)
      const rep = representativeTask(series, today, timeZone)
      if (!rep) return chip
      return (
        <TaskContextMenu
          task={rep}
          deleteLabel={series.length > 1 ? 'Delete all occurrences' : 'Delete'}
          onRemove={() => unscheduleTask(rep.id)}
          onRequestDelete={() => setPendingDelete({ key, title: rep.title, count: series.length })}
        >
          {chip}
        </TaskContextMenu>
      )
    },
    addToFolder: (folderId) => openTaskWindow({ mode: 'new', prefill: { kind: 'task', folderId } }),
  }

  if (!board) return null

  return (
    <section aria-labelledby={headingId}>
      <div className="mx-auto max-w-page px-16">
        <BoardActionsContext.Provider value={actions}>
          <Board
            board={board}
            categories={categories}
            items={items}
            onToggleItem={(key) => toggleBoardItem(key)}
            headingId={headingId}
            today={today}
          />
        </BoardActionsContext.Provider>
      </div>
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Are you sure?"
        description={
          pendingDelete && pendingDelete.count > 1
            ? `All ${pendingDelete.count} occurrences of “${pendingDelete.title}” will be permanently deleted.`
            : 'Your task will be permanently deleted.'
        }
        choices={[
          { label: 'Cancel', onSelect: () => setPendingDelete(null) },
          {
            label: 'Proceed',
            onSelect: () => {
              if (pendingDelete) deleteSeries(pendingDelete.key)
              setPendingDelete(null)
            },
          },
        ]}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  )
}
