import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { MOCK_ADS } from '../data/mock/ads'
import { MOCK_BOARD_ITEMS, MOCK_BOARDS, MOCK_CATEGORIES } from '../data/mock/boards'
import { createMockPage } from '../data/mock/pgPage'
import { GALLERY_AD_COUNT, pickAds } from '../domain/ads'
import * as boards from '../domain/boards'
import * as dayActions from '../domain/dayActions'
import type { Ad, Board, BoardItem, Category, CategoryId, Goal, GoalScope, PGPage, Task } from '../domain/types'

type PGPageState = {
  page: PGPage
  /** Picked once when the store is created: stable for the whole page load. */
  galleryAds: Ad[]
  /** Category boards below the gallery, in page order (OQ-18: fixed order). */
  boards: Board[]
  boardItems: Record<string, BoardItem>
  categories: Record<CategoryId, Category>
  toggleGoal: (goalId: string) => void
  toggleTask: (taskId: string) => void
  checkAll: (day: Date) => void
  resetDay: (day: Date) => void
  /** Flips a board item todo ↔ done. Inactive items are ignored (OQ-16). */
  toggleBoardItem: (itemId: string) => void
}

// Static UI phase: the page always comes from mock data (README rule 1).
export const usePGPageStore = create<PGPageState>()((set) => ({
  page: createMockPage(),
  galleryAds: pickAds(MOCK_ADS, GALLERY_AD_COUNT),
  boards: MOCK_BOARDS,
  boardItems: MOCK_BOARD_ITEMS,
  categories: MOCK_CATEGORIES,
  toggleGoal: (goalId) => set((s) => ({ page: dayActions.toggleGoal(s.page, goalId) })),
  toggleTask: (taskId) => set((s) => ({ page: dayActions.toggleTask(s.page, taskId) })),
  checkAll: (day) => set((s) => ({ page: dayActions.checkAll(s.page, day) })),
  resetDay: (day) => set((s) => ({ page: dayActions.resetDay(s.page, day) })),
  toggleBoardItem: (itemId) => set((s) => ({ boardItems: boards.toggleBoardItem(s.boardItems, itemId) })),
}))

/*
 * Per-section selector hooks. Reducers keep unchanged items by reference, so
 * shallow comparison means toggling a day goal does not re-render month goals.
 */

export function useGoals(scope: GoalScope): Goal[] {
  return usePGPageStore(useShallow((s) => s.page.goals.filter((g) => g.scope === scope)))
}

export function useTasks(): Task[] {
  return usePGPageStore((s) => s.page.tasks)
}

export function usePageMeta() {
  return usePGPageStore(
    useShallow((s) => ({
      ownerName: s.page.ownerName,
      title: s.page.title,
      version: s.page.version,
      timeZone: s.page.timeZone,
    })),
  )
}

/** The ads hanging on the gallery wall for this page load. */
export function useGalleryAds(): Ad[] {
  return usePGPageStore((s) => s.galleryAds)
}

export function usePGPageActions() {
  return usePGPageStore(
    useShallow((s) => ({
      toggleGoal: s.toggleGoal,
      toggleTask: s.toggleTask,
      checkAll: s.checkAll,
      resetDay: s.resetDay,
    })),
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
