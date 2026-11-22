import type { Phase } from '../../domain/types'

export type { TimeScale } from '../../domain/timeline'

export type OpenPhaseHandler = (phase: Phase, taskTitle: string, trigger: SVGElement) => void
