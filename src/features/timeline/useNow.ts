import { useEffect, useState } from 'react'

/** Current time, refreshed every `intervalMs`. Keep its consumers small (PROJECT_BRIEF §8). */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
