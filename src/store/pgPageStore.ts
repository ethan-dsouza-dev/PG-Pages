import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { MOCK_ADS } from '../data/mock/ads'
import { MOCK_BOARD_ITEMS, MOCK_BOARDS, MOCK_CATEGORIES } from '../data/mock/boards'
import { createMockPage } from '../data/mock/pgPage'
import { changeWallAd, GALLERY_AD_COUNT, pickAds } from '../domain/ads'
import * as boards from '../domain/boards'
import * as dailyReset from '../domain/dailyReset'
import * as dayActions from '../domain/dayActions'
import * as pages from '../domain/pages'
import * as taskActions from '../domain/taskActions'
import type { Ad, Board, BoardItem, Category, CategoryId, Goal, GoalScope, PGPage, Task } from '../domain/types'

/** Holds every PG Page; the selector hooks below read the active one. */
type PGPageState = pages.PageCollection & {
  /** Every ad that may hang on the wall (OQ-10: the real source is still open). */
  adPool: readonly Ad[]
  /**
   * Picked once when the store is created, so stable for the whole page load
   * except for slots the user swaps with `changeGalleryAd`.
   */
  galleryAds: Ad[]
  /** Category boards below the gallery, in page order (fixed: LP-7.1, OQ-18). */
  boards: Board[]
  boardItems: Record<string, BoardItem>
  categories: Record<CategoryId, Category>
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
  /** Flips a board item todo ↔ done. Inactive items are ignored (OQ-16). */
  toggleBoardItem: (itemId: string) => void
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

// Static UI phase: the page always comes from mock data (README rule 1).
export const usePGPageStore = create<PGPageState>()((set) => {
  /** Runs a page reducer on the active page only. */
  const onActive = (update: (page: PGPage) => PGPage) =>
    set((s) => pages.updateActivePage(s, update))

  return {
    ...pages.collectionOf(createMockPage()),
    adPool: MOCK_ADS,
    galleryAds: pickAds(MOCK_ADS, GALLERY_AD_COUNT),
    boards: MOCK_BOARDS,
    boardItems: MOCK_BOARD_ITEMS,
    categories: MOCK_CATEGORIES,
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
    toggleBoardItem: (itemId) => set((s) => ({ boardItems: boards.toggleBoardItem(s.boardItems, itemId) })),
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

/* ---------- Boards slice ---------- */

export function useBoards(): Board[] {
  return usePGPageStore((s) => s.boards)
}

export function useBoard(boardId: string): Board | undefined {
  return usePGPageStore((s) => s.boards.find((b) => b.id === boardId))
}

/** Every board item by id. Toggling keeps untouched items by reference. */
export function useBoardItems(): Record<string, BoardItem> {
  return usePGPageStore((s) => s.boardItems)
}

export function useCategories(): Record<CategoryId, Category> {
  return usePGPageStore((s) => s.categories)
}

export function useCategory(categoryId: CategoryId): Category | undefined {
  return usePGPageStore((s) => s.categories[categoryId])
}

export function useBoardActions() {
  return usePGPageStore(useShallow((s) => ({ toggleBoardItem: s.toggleBoardItem })))
}
