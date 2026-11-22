import { useEffect } from 'react'
import { usePGPageStore } from '../../store/pgPageStore'

/**
 * LP-5.3: while the page is open, run the automatic daily reset whenever the
 * page's reset time passes. Checks on mount (covers a reload after the reset
 * time), on an interval, and when the tab becomes visible again (background
 * timers are throttled, and a laptop may wake long after the boundary).
 * The "is it due?" decision lives in `domain/dailyReset`, so extra checks are
 * harmless: each boundary resets exactly once.
 */
export function useDailyReset(intervalMs = 30_000): void {
  useEffect(() => {
    const check = () => usePGPageStore.getState().runDailyResetIfDue(new Date())
    const onVisibility = () => {
      if (document.visibilityState === 'visible') check()
    }

    check()
    const id = setInterval(check, intervalMs)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [intervalMs])
}
