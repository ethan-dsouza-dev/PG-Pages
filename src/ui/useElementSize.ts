import { useEffect, useState } from 'react'

type Size = { width: number; height: number }

/** Tracks an element's content size. Returns a callback ref and the latest size. */
export function useElementSize<T extends Element>() {
  const [element, setElement] = useState<T | null>(null)
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })

  useEffect(() => {
    if (!element) return
    const update = (width: number, height: number) =>
      setSize((s) => (s.width === width && s.height === height ? s : { width, height }))

    // Measure immediately: ResizeObserver only reports during a rendered frame,
    // which never comes in background tabs or hidden panes.
    update(element.clientWidth, element.clientHeight)

    const observer = new ResizeObserver(([entry]) => {
      update(entry.contentRect.width, entry.contentRect.height)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])

  return [setElement, size] as const
}
