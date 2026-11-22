import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMockPage } from '../data/mock/pgPage'
import { collectionOf } from '../domain/pages'
import { GALLERY_AD_COUNT } from '../domain/ads'
import { MOCK_BOARD_ITEMS } from '../data/mock/boards'
import {
  useBoardActions,
  useBoardItems,
  useGalleryAds,
  useGoals,
  usePageCollectionActions,
  usePageMeta,
  usePages,
  usePGPageActions,
  usePGPageStore,
  useTasks,
} from './pgPageStore'

describe('pgPageStore', () => {
  beforeEach(() => {
    usePGPageStore.setState(collectionOf(createMockPage()))
  })

  it('toggling a day goal does not re-render month-goal subscribers', () => {
    let monthRenders = 0
    const month = renderHook(() => {
      monthRenders++
      return useGoals('month')
    })
    const day = renderHook(() => useGoals('day'))
    const actions = renderHook(() => usePGPageActions())
    const rendersBefore = monthRenders

    act(() => actions.result.current.toggleGoal(day.result.current[0].id))

    expect(day.result.current[0].completed).toBe(true)
    expect(monthRenders).toBe(rendersBefore)
    expect(month.result.current).toHaveLength(5)
  })

  it('checkAll completes every day goal', () => {
    const day = renderHook(() => useGoals('day'))
    const actions = renderHook(() => usePGPageActions())
    act(() => actions.result.current.checkAll(new Date()))
    expect(day.result.current.every((g) => g.completed)).toBe(true)
  })

  it('picks the gallery ads once and keeps them through goal toggles and Check All', () => {
    const ads = renderHook(() => useGalleryAds())
    const day = renderHook(() => useGoals('day'))
    const actions = renderHook(() => usePGPageActions())
    const before = ads.result.current

    expect(before).toHaveLength(GALLERY_AD_COUNT)
    expect(new Set(before.map((a) => a.id)).size).toBe(GALLERY_AD_COUNT)

    act(() => actions.result.current.toggleGoal(day.result.current[0].id))
    act(() => actions.result.current.checkAll(new Date()))
    act(() => actions.result.current.resetDay(new Date()))

    expect(ads.result.current).toBe(before)
  })

  describe('pages (LP-2.1 to LP-2.3)', () => {
    it('renames the active page', () => {
      const meta = renderHook(() => usePageMeta())
      const actions = renderHook(() => usePageCollectionActions())
      expect(meta.result.current.name).toBe("Jake's First")
      act(() => actions.result.current.renamePage('Fall term'))
      expect(meta.result.current.name).toBe('Fall term')
    })

    it('creates an empty page with a fresh id and switches to it', () => {
      const meta = renderHook(() => usePageMeta())
      const list = renderHook(() => usePages())
      const tasks = renderHook(() => useTasks())
      const day = renderHook(() => useGoals('day'))
      const actions = renderHook(() => usePageCollectionActions())
      const firstId = meta.result.current.id

      act(() => actions.result.current.createPage())

      expect(list.result.current).toHaveLength(2)
      expect(meta.result.current.id).not.toBe(firstId)
      expect(meta.result.current.name).toBe('Untitled')
      expect(tasks.result.current).toEqual([])
      expect(day.result.current).toEqual([])
    })

    it('switches between pages, each keeping its own goals, tasks and name', () => {
      const meta = renderHook(() => usePageMeta())
      const day = renderHook(() => useGoals('day'))
      const actions = renderHook(() => usePageCollectionActions())
      const dayActions = renderHook(() => usePGPageActions())
      const firstId = meta.result.current.id

      act(() => dayActions.result.current.checkAll(new Date()))
      act(() => actions.result.current.createPage())
      const secondId = meta.result.current.id
      act(() => actions.result.current.renamePage('Second'))
      act(() => dayActions.result.current.checkAll(new Date()))
      expect(day.result.current).toEqual([])

      act(() => actions.result.current.switchPage(firstId))
      expect(meta.result.current.name).toBe("Jake's First")
      expect(day.result.current).toHaveLength(5)
      expect(day.result.current.every((g) => g.completed)).toBe(true)

      act(() => dayActions.result.current.resetDay(new Date()))
      act(() => actions.result.current.switchPage(secondId))
      expect(meta.result.current.name).toBe('Second')
      act(() => actions.result.current.switchPage(firstId))
      expect(day.result.current.some((g) => g.completed)).toBe(false)
    })

    it('leaves inactive pages untouched by day actions', () => {
      const actions = renderHook(() => usePageCollectionActions())
      const dayActions = renderHook(() => usePGPageActions())
      const first = usePGPageStore.getState().pages[0]
      act(() => actions.result.current.createPage())
      act(() => dayActions.result.current.checkAll(new Date()))
      act(() => actions.result.current.renamePage('Other'))
      expect(usePGPageStore.getState().pages[0]).toBe(first)
    })
  })

  describe('boards slice', () => {
    beforeEach(() => {
      usePGPageStore.setState({ boardItems: MOCK_BOARD_ITEMS })
    })

    it('toggles a board item between todo and done', () => {
      const items = renderHook(() => useBoardItems())
      const actions = renderHook(() => useBoardActions())
      act(() => actions.result.current.toggleBoardItem('sc-clean-clean'))
      expect(items.result.current['sc-clean-clean'].status).toBe('done')
      act(() => actions.result.current.toggleBoardItem('sc-clean-clean'))
      expect(items.result.current['sc-clean-clean'].status).toBe('todo')
    })

    it('ignores inactive items', () => {
      const items = renderHook(() => useBoardItems())
      const actions = renderHook(() => useBoardActions())
      const before = items.result.current
      expect(before['sc-unsorted-meet-design'].status).toBe('inactive')
      act(() => actions.result.current.toggleBoardItem('sc-unsorted-meet-design'))
      expect(items.result.current).toBe(before)
    })
  })
})
