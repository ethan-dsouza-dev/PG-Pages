import { defaultFolderId } from '../../domain/boardTasks'
import { emptyForm, formFromGoal, formFromTask, type ItemForm } from '../../domain/taskForm'
import type { PGPage } from '../../domain/types'
import type { TaskWindowRequest } from '../../store/pgPageStore'

/** The form a request opens with, or null when its item no longer exists. */
export function initialFormFor(request: TaskWindowRequest, page: PGPage, now: Date): ItemForm | null {
  const tz = page.timeZone
  if (request.mode === 'new') {
    const fallback = defaultFolderId(page.boards, page.boards[0]?.categoryId ?? 'productivity') ?? ''
    return emptyForm(request.prefill, now, tz, request.prefill.folderId ?? fallback)
  }
  if ('goalId' in request) {
    const goal = page.goals.find((g) => g.id === request.goalId)
    return goal ? formFromGoal(goal, now, tz) : null
  }
  const task = page.tasks.find((t) => t.id === request.taskId)
  return task ? formFromTask(task, page.boards, tz) : null
}
