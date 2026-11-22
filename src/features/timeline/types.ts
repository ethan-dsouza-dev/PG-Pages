import type { Phase, Task } from '../../domain/types'

export type { TimeScale } from '../../domain/timeline'

/** Opens the task window on a subphase of `task` (TW-1.4). */
export type OpenPhaseHandler = (task: Task, phase: Phase) => void

/** Asks for confirmation before deleting `task` (LP-6.10). `trigger` gets focus back on cancel. */
export type RequestDeleteHandler = (task: Task, trigger: SVGElement) => void
