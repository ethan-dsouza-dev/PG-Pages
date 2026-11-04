import type { Phase, TimeSpan } from './types'

export type PhaseSegment = {
  id: string
  /** Start as a fraction (0..1) of the span. */
  startFr: number
  /** End as a fraction (0..1) of the span. */
  endFr: number
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/**
 * Positions phases along their item's own span (not the timeline window).
 * Phases are clamped to the span, ones entirely outside it are dropped, and the
 * result is sorted by start. An empty or invalid span yields no segments.
 */
export function phaseSegments(span: TimeSpan, phases: readonly Phase[]): PhaseSegment[] {
  const start = Date.parse(span.start)
  const length = Date.parse(span.end) - start
  if (!Number.isFinite(length) || length <= 0) return []

  return phases
    .map((phase) => ({
      id: phase.id,
      startFr: clamp01((Date.parse(phase.start) - start) / length),
      endFr: clamp01((Date.parse(phase.end) - start) / length),
    }))
    .filter((s) => Number.isFinite(s.startFr) && Number.isFinite(s.endFr) && s.endFr > s.startFr)
    .sort((a, b) => a.startFr - b.startFr)
}
