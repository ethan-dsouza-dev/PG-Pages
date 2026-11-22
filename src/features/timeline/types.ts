import type { ScaleTime } from 'd3-scale'
import type { Phase, Task } from '../../domain/types'

export type TimeScale = ScaleTime<number, number>

export type OpenPhaseHandler = (phase: Phase, taskTitle: string, trigger: SVGElement) => void

/** Asks for confirmation before deleting `task` (LP-6.10). `trigger` gets focus back on cancel. */
export type RequestDeleteHandler = (task: Task, trigger: SVGElement) => void
