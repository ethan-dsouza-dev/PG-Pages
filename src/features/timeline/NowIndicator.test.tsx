import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TimelinePanel } from './TimelinePanel'

const renders = vi.hoisted(() => ({ taskRow: 0 }))

// Count TaskRow renders without changing what it renders.
vi.mock('./TaskRow', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./TaskRow')>()
  return {
    TaskRow: (props: Parameters<typeof actual.TaskRow>[0]) => {
      renders.taskRow++
      return actual.TaskRow(props)
    },
  }
})

describe('NowIndicator isolation', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('moves on the minute tick without re-rendering task rows', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    const noon = new Date()
    noon.setHours(12, 0, 0, 0)
    vi.setSystemTime(noon)

    render(<TimelinePanel />)
    const line = screen.getByTestId('now-indicator')
    const xBefore = Number(line.getAttribute('x'))
    const rowRendersBefore = renders.taskRow
    expect(rowRendersBefore).toBeGreaterThan(0)

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(Number(screen.getByTestId('now-indicator').getAttribute('x'))).toBeGreaterThan(xBefore)
    expect(renders.taskRow).toBe(rowRendersBefore)
  })
})
