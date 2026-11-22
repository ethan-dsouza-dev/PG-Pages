import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { MOCK_ADS } from '../data/mock/ads'
import { MOCK_CATEGORIES } from '../data/mock/boards'
import { createMockPage } from '../data/mock/pgPage'
import { changeWallAd, GALLERY_AD_COUNT, pickAds } from '../domain/ads'
import { representativeTask, taskKey, tasksForKey } from '../domain/boardTasks'
import * as dailyReset from '../domain/dailyReset'
import * as dayActions from '../domain/dayActions'
import * as pages from '../domain/pages'
import * as taskActions from '../domain/taskActions'
import type { ItemForm, Prefill } from '../domain/taskForm'
import * as taskSave from '../domain/taskSave'
import { calendarDate } from '../domain/todaySplit'
import type { Ad, Board, Category, CategoryId, Goal, GoalScope, PGPage, Task } from '../domain/types'

/** Holds every PG Page; the selector hooks below read the active one. */
type PGPageState = pages.PageCollection & {
  /** Every ad that may hang on the wall (OQ-10: the real source is still open). */
  adPool: readonly Ad[]
  /**
   * Picked once when the store is created, so stable for the whole page load
   * except for slots the user swaps with `changeGalleryAd`.
   */
  galleryAds: Ad[]
  categories: Record<CategoryId, Category>
  /** LP-3.7 "Show 24 hours". Store-only: resets on reload in this phase. */
  showFullDay: boolean
  setShowFullDay: (showFullDay: boolean) => void
  toggleGoal: (goalId: string) => void
  toggleTask: (taskId: string) => void
  checkAll: (day: Date) => void
  resetDay: (day: Date) => void
  /** LP-5.2: change the page's daily reset time ("HH:mm"). */
  setResetTime: (resetTime: string, now: Date) => void
  /** LP-5.3: run the automatic daily reset if the reset time passed since the last one. */
  runDailyResetIfDue: (now: Date) => void
  /** LP-6.9: takes a task off the schedule as of `now`; it stays in the page. */
  unscheduleTask: (taskId: string, now?: Date) => void
  /** LP-6.10: permanently removes a task from the page. */
  deleteTask: (taskId: string) => void
  /**
   * Flips the task a board chip stands for (its occurrence today, else the
   * next one) todo ↔ done. Inactive tasks are ignored (OQ-16).
   */
  toggleBoardItem: (key: string, now?: Date) => void
  /** Deletes every occurrence listed under a board chip. */
  deleteSeries: (key: string) => void
  /** The New / Edit Task window (TW-1). Null while closed. */
  taskWindow: TaskWindowRequest | null
  openTaskWindow: (request: TaskWindowRequest) => void
  closeTaskWindow: () => void
  /** Create an instance / list instances (TW-6.1, TW-6.2). Null while closed. */
  instanceDialog: InstanceDialogRequest | null
  openInstanceDialog: (request: InstanceDialogRequest) => void
  closeInstanceDialog: () => void
  /** Saves a New or Duplicate form; returns the new item's id. */
  createItem: (form: ItemForm, now?: Date) => string
  /** Saves an Edit form onto a task (TW-6.4 `scope`). */
  updateTask: (taskId: string, form: ItemForm, scope: taskSave.EditScope, now?: Date) => void
  /** Saves an Edit form onto a goal or theme. */
  updateGoal: (goalId: string, form: ItemForm) => void
  deleteGoal: (goalId: string) => void
  createInstance: (taskId: string, start: string, end: string, now?: Date) => void
  /**
   * Swaps the ad in gallery slot `slot` for one from the pool not already on
   * the wall (LP-8.2). In memory only for now; LP-8.2 saves it per user.
   */
  changeGalleryAd: (slot: number) => void
  /** LP-2.1: names the active page. */
  renamePage: (name: string) => void
  /** LP-2.2: adds an empty page and switches to it. */
  createPage: () => void
  /** LP-2.3: shows another page. */
  switchPage: (pageId: string) => void
}

/** What the New / Edit Task window was opened for (TW-1.2). */
export type TaskWindowRequest =
  | { mode: 'new'; prefill: Prefill }
  /** `phasePath` opens the window slid to that subphase (TW-1.4). */
  | { mode: 'edit'; kind: 'task'; taskId: string; phasePath?: string[] }
  | { mode: 'edit'; kind: 'goal'; goalId: string }
  | { mode: 'duplicate'; kind: 'task'; taskId: string }
  | { mode: 'duplicate'; kind: 'goal'; goalId: string }
  /** Edits one occurrence only (TW-6.3). */
  | { mode: 'instance'; taskId: string }

export type InstanceDialogRequest = { taskId: string; view: 'create' | 'list' }

// Static UI phase: the page always comes from mock data (README rule 1).
export const usePGPageStore = create<PGPageState>()((set) => {
  /** Runs a page reducer on the active page only. */
  const onActive = (update: (page: PGPage) => PGPage) =>
    set((s) => pages.updateActivePage(s, update))

  return {
    ...pages.collectionOf(createMockPage()),
    adPool: MOCK_ADS,
    galleryAds: pickAds(MOCK_ADS, GALLERY_AD_COUNT),
    categories: MOCK_CATEGORIES,
    showFullDay: false,
    setShowFullDay: (showFullDay) => set({ showFullDay }),
    toggleGoal: (goalId) => onActive((p) => dayActions.toggleGoal(p, goalId)),
    toggleTask: (taskId) => onActive((p) => dayActions.toggleTask(p, taskId)),
    checkAll: (day) => onActive((p) => dayActions.checkAll(p, day)),
    resetDay: (day) => onActive((p) => dayActions.resetDay(p, day)),
    setResetTime: (resetTime, now) => onActive((p) => dailyReset.changeResetTime(p, resetTime, now)),
    // Every page resets at its own reset time, shown or not.
    runDailyResetIfDue: (now) =>
      set((s) => {
        let changed = false
        const next = s.pages.map((p) => {
          const reset = dailyReset.applyDailyResetIfDue(p, now)
          if (reset !== p) changed = true
          return reset
        })
        return changed ? { pages: next } : s
      }),
    unscheduleTask: (taskId, now = new Date()) => onActive((p) => taskActions.unscheduleTask(p, taskId, now)),
    deleteTask: (taskId) => onActive((p) => taskActions.deleteTask(p, taskId)),
    toggleBoardItem: (key, now = new Date()) =>
      onActive((p) => {
        const rep = representativeTask(tasksForKey(p.tasks, key), calendarDate(now, p.timeZone), p.timeZone)
        return rep && !rep.inactive ? dayActions.toggleTask(p, rep.id) : p
      }),
    deleteSeries: (key) => onActive((p) => taskSave.deleteSeries(p, key)),
    taskWindow: null,
    openTaskWindow: (request) => set({ taskWindow: request }),
    closeTaskWindow: () => set({ taskWindow: null }),
    instanceDialog: null,
    openInstanceDialog: (request) => set({ instanceDialog: request }),
    closeInstanceDialog: () => set({ instanceDialog: null }),
    createItem: (form, now = new Date()) => {
      let id = ''
      onActive((p) => {
        const saved = taskSave.createFromForm(p, form, { now })
        id = saved.id
        return saved.page
      })
      return id
    },
    updateTask: (taskId, form, scope, now = new Date()) =>
      onActive((p) => taskSave.updateTaskFromForm(p, taskId, form, scope, { now })),
    updateGoal: (goalId, form) => onActive((p) => taskSave.updateGoalFromForm(p, goalId, form)),
    deleteGoal: (goalId) => onActive((p) => taskSave.deleteGoal(p, goalId)),
    createInstance: (taskId, start, end, now = new Date()) =>
      onActive((p) => taskSave.createInstance(p, taskId, start, end, { now })),
    // TODO(LP-8.2): save the swap per user once persistence exists.
    changeGalleryAd: (slot) => set((s) => ({ galleryAds: changeWallAd(s.adPool, s.galleryAds, slot) })),
    renamePage: (name) => onActive((p) => pages.renamePage(p, name)),
    createPage: () => set((s) => pages.addEmptyPage(s, crypto.randomUUID())),
    switchPage: (pageId) => set((s) => pages.switchPage(s, pageId)),
  }
})

/** The page every section shows. */
const active = (s: PGPageState): PGPage => pages.activePage(s)

/*
 * Per-section selector hooks. Reducers keep unchanged items by reference, so
 * shallow comparison means toggling a day goal does not re-render month goals.
 */

export function useGoals(scope: GoalScope): Goal[] {
  return usePGPageStore(useShallow((s) => active(s).goals.filter((g) => g.scope === scope)))
}

/** Every goal and theme on the page. */
export function useAllGoals(): Goal[] {
  return usePGPageStore((s) => active(s).goals)
}

export function useTask(taskId: string): Task | undefined {
  return usePGPageStore((s) => active(s).tasks.find((t) => t.id === taskId))
}

/** Every occurrence stored under the same key as `taskId`, earliest first. */
export function useSeriesOf(taskId: string): Task[] {
  return usePGPageStore(
    useShallow((s) => {
      const tasks = active(s).tasks
      const task = tasks.find((t) => t.id === taskId)
      return task ? tasksForKey(tasks, taskKey(task)) : []
    }),
  )
}

/** The active page, for the task window's lookups. */
export function useActivePage(): PGPage {
  return usePGPageStore(active)
}

export function useTasks(): Task[] {
  return usePGPageStore((s) => active(s).tasks)
}

/** Tasks shown on the timeline: every task not taken off the schedule. */
export function useScheduledTasks(): Task[] {
  return usePGPageStore(useShallow((s) => taskActions.scheduledTasks(active(s).tasks)))
}

export function usePageMeta() {
  return usePGPageStore(
    useShallow((s) => ({
      id: active(s).id,
      ownerName: active(s).ownerName,
      name: active(s).name,
      version: active(s).version,
      timeZone: active(s).timeZone,
    })),
  )
}

export function useResetTime(): string {
  return usePGPageStore((s) => active(s).resetTime)
}

/** The ads hanging on the gallery wall for this page load. */
export function useGalleryAds(): Ad[] {
  return usePGPageStore((s) => s.galleryAds)
}

/** True when the pool holds an ad that is not on the wall yet, so "Change ad" can do something. */
export function useCanChangeGalleryAd(): boolean {
  return usePGPageStore((s) => {
    const hanging = new Set(s.galleryAds.map((ad) => ad.id))
    return s.adPool.some((ad) => !hanging.has(ad.id))
  })
}

export function useGalleryActions() {
  return usePGPageStore(useShallow((s) => ({ changeGalleryAd: s.changeGalleryAd })))
}

export function usePGPageActions() {
  return usePGPageStore(
    useShallow((s) => ({
      toggleGoal: s.toggleGoal,
      toggleTask: s.toggleTask,
      checkAll: s.checkAll,
      resetDay: s.resetDay,
      setResetTime: s.setResetTime,
      unscheduleTask: s.unscheduleTask,
      deleteTask: s.deleteTask,
    })),
  )
}

/** Every PG Page, in "Your PG Pages" order. */
export function usePages(): PGPage[] {
  return usePGPageStore((s) => s.pages)
}

export function usePageCollectionActions() {
  return usePGPageStore(
    useShallow((s) => ({ renamePage: s.renamePage, createPage: s.createPage, switchPage: s.switchPage })),
  )
}

/* ---------- Timeline settings ---------- */

export function useShowFullDay(): [boolean, (showFullDay: boolean) => void] {
  return usePGPageStore(useShallow((s) => [s.showFullDay, s.setShowFullDay]))
}

/* ---------- Boards slice ---------- */

/** The active page's boards (folders), in page order. */
export function useBoards(): Board[] {
  return usePGPageStore((s) => active(s).boards)
}

export function useBoard(boardId: string): Board | undefined {
  return usePGPageStore((s) => active(s).boards.find((b) => b.id === boardId))
}

export function useCategories(): Record<CategoryId, Category> {
  return usePGPageStore((s) => s.categories)
}

export function useCategory(categoryId: CategoryId): Category | undefined {
  return usePGPageStore((s) => s.categories[categoryId])
}

export function useBoardActions() {
  return usePGPageStore(useShallow((s) => ({ toggleBoardItem: s.toggleBoardItem, deleteSeries: s.deleteSeries })))
}

/* ---------- Task window ---------- */

export function useTaskWindowRequest(): TaskWindowRequest | null {
  return usePGPageStore((s) => s.taskWindow)
}

export function useInstanceDialogRequest(): InstanceDialogRequest | null {
  return usePGPageStore((s) => s.instanceDialog)
}

export function useTaskWindowActions() {
  return usePGPageStore(
    useShallow((s) => ({
      openTaskWindow: s.openTaskWindow,
      closeTaskWindow: s.closeTaskWindow,
      openInstanceDialog: s.openInstanceDialog,
      closeInstanceDialog: s.closeInstanceDialog,
      createItem: s.createItem,
      updateTask: s.updateTask,
      updateGoal: s.updateGoal,
      deleteGoal: s.deleteGoal,
      createInstance: s.createInstance,
    })),
  )
}
