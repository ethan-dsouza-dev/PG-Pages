import { describe, expect, it } from 'vitest'
import { phaseSegments } from './phaseSegments'
import type { Phase } from './types'

const hour = (h: number) => new Date(Date.UTC(2026, 0, 1, h)).toISOString()
const phase = (id: string, start: number, end: number): Phase => ({ id, title: id, start: hour(start), end: hour(end) })
const span = { start: hour(0), end: hour(10) }

describe('phaseSegments', () => {
  it('positions phases as fractions of the item span', () => {
    expect(phaseSegments(span, [phase('a', 0, 4), phase('b', 4, 10)])).toEqual([
      { id: 'a', startFr: 0, endFr: 0.4 },
      { id: 'b', startFr: 0.4, endFr: 1 },
    ])
  })

  it('sorts by start', () => {
    const result = phaseSegments(span, [phase('late', 6, 8), phase('early', 1, 2)])
    expect(result.map((s) => s.id)).toEqual(['early', 'late'])
  })

  it('clamps phases that overhang the span and drops ones outside it', () => {
    expect(phaseSegments(span, [phase('over', -2, 3), phase('tail', 8, 14), phase('out', 11, 12)])).toEqual([
      { id: 'over', startFr: 0, endFr: 0.3 },
      { id: 'tail', startFr: 0.8, endFr: 1 },
    ])
  })

  it('returns nothing for an empty or inverted span', () => {
    expect(phaseSegments({ start: hour(3), end: hour(3) }, [phase('a', 3, 4)])).toEqual([])
    expect(phaseSegments({ start: hour(5), end: hour(1) }, [phase('a', 1, 4)])).toEqual([])
    expect(phaseSegments(span, [])).toEqual([])
  })

  it('drops zero-length and unparseable phases', () => {
    const bad: Phase = { id: 'bad', title: 'bad', start: 'nope', end: hour(2) }
    expect(phaseSegments(span, [phase('zero', 2, 2), bad])).toEqual([])
  })
})
