import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMockPage } from '../data/mock/pgPage'
import { GALLERY_AD_COUNT } from '../domain/ads'
import { useGalleryAds, useGoals, usePGPageActions, usePGPageStore } from './pgPageStore'

describe('pgPageStore', () => {
  beforeEach(() => {
    usePGPageStore.setState({ page: createMockPage() })
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
})
