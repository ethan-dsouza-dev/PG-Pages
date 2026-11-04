import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { MOCK_ADS } from '../data/mock/ads'
import { createMockPage } from '../data/mock/pgPage'
import { GALLERY_AD_COUNT, pickAds } from '../domain/ads'
import * as dayActions from '../domain/dayActions'
import type { Ad, Goal, GoalScope, PGPage, Task } from '../domain/types'

type PGPageState = {
  page: PGPage
  /** Picked once when the store is created: stable for the whole page load. */
  galleryAds: Ad[]
  toggleGoal: (goalId: string) => void
  toggleTask: (taskId: string) => void
  checkAll: (day: Date) => void
  resetDay: (day: Date) => void
}

// Static UI phase: the page always comes from mock data (README rule 1).
export const usePGPageStore = create<PGPageState>()((set) => ({
  page: createMockPage(),
  galleryAds: pickAds(MOCK_ADS, GALLERY_AD_COUNT),
  toggleGoal: (goalId) => set((s) => ({ page: dayActions.toggleGoal(s.page, goalId) })),
  toggleTask: (taskId) => set((s) => ({ page: dayActions.toggleTask(s.page, taskId) })),
  checkAll: (day) => set((s) => ({ page: dayActions.checkAll(s.page, day) })),
  resetDay: (day) => set((s) => ({ page: dayActions.resetDay(s.page, day) })),
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
