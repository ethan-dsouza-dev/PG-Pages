import type { ScaleTime } from 'd3-scale'
import type { Phase } from '../../domain/types'

export type TimeScale = ScaleTime<number, number>

export type OpenPhaseHandler = (phase: Phase, taskTitle: string, trigger: SVGElement) => void
