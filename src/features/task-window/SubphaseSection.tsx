import { useContext, useState } from 'react'
import { fromLocalDateTime } from '../../domain/localTime'
import { MAX_SPLIT, phaseDisplayName, type MilestoneDraft, type PhaseDraft } from '../../domain/taskForm'
import type { SplitMode } from '../../domain/types'
import { cx } from '../../ui'
import { RadioGroup } from './formControls'
import { controlId, FieldContext, inputClass, smallButtonClass } from './fieldContext'

/** Section fill and a label color that stays readable on it. */
const SEGMENT_COLORS = [
  'bg-subphase-1 text-text-on-accent',
  'bg-subphase-2 text-text',
  'bg-subphase-3 text-text-on-accent',
  'bg-subphase-4 text-text',
  'bg-subphase-5 text-text-on-accent',
  'bg-subphase-6 text-text',
] as const

type SubphaseSectionProps = {
  /** The span being split, as local date-times. */
  start: string
  end: string
  timeZone: string
  subphases: PhaseDraft[]
  split?: SplitMode
  milestones: MilestoneDraft[]
  /** Name of what is being split, for labels ("F101 Assignment", "Phase 2"). */
  ownerName: string
  onSplit: (count: number, mode: SplitMode) => void
  onOpen: (phaseId: string) => void
  onRemoveAll: () => void
}

/**
 * TW-4.1 / TW-4.2: the bar preview, split into coloured sections once
 * subphases exist (click one to open its panel), with milestones as lines.
 * Gaps left by deleted subphases stay empty (TW-4.6).
 */
export function SubphaseSection(props: SubphaseSectionProps) {
  const { start, end, timeZone, subphases, split, milestones, ownerName, onSplit, onOpen, onRemoveAll } = props
  const { prefix, errors } = useContext(FieldContext)
  const [count, setCount] = useState(2)
  const [mode, setMode] = useState<SplitMode>('even')
  const s = fromLocalDateTime(start, timeZone)?.getTime()
  const e = fromLocalDateTime(end, timeZone)?.getTime()
  const valid = s !== undefined && e !== undefined && e > s
  const pct = (local: string) => {
    const t = fromLocalDateTime(local, timeZone)?.getTime()
    if (!valid || t === undefined) return 0
    return Math.min(100, Math.max(0, ((t - s) / (e - s)) * 100))
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-label">Subphases</legend>
      <div
        role="group"
        aria-label={`Bar preview for ${ownerName}`}
        className="relative h-10 overflow-hidden rounded-chip border-2 border-border-strong bg-surface-base"
      >
        {subphases.length === 0 && <span className="absolute inset-0 bg-task-todo" aria-hidden="true" />}
        {subphases.map((p, i) => {
          const left = pct(p.start)
          const width = Math.max(1.5, pct(p.end) - left)
          const hasError = `phase:${p.id}` in errors
          return (
            <button
              key={p.id}
              id={controlId(prefix, `phase:${p.id}`)}
              type="button"
              onClick={() => onOpen(p.id)}
              aria-label={`Edit ${phaseDisplayName(p, i)}${hasError ? ', has a problem' : ''}`}
              aria-invalid={hasError || undefined}
              title={phaseDisplayName(p, i)}
              style={{ left: `${left}%`, width: `${width}%` }}
              className={cx(
                'interactive absolute inset-y-0 truncate border-r-2 border-surface-base px-1 text-meta',
                SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                hasError && 'outline-3 -outline-offset-3 outline-error',
              )}
            >
              {phaseDisplayName(p, i)}
            </button>
          )
        })}
        {milestones.map((m) => (
          <span
            key={m.id}
            aria-hidden="true"
            title={m.label}
            style={{ left: `${pct(m.at)}%` }}
            className="pointer-events-none absolute inset-y-0 w-0.5 bg-milestone"
          />
        ))}
      </div>

      {subphases.length === 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1 text-label">
              How many
              <input
                type="number"
                min={1}
                max={MAX_SPLIT}
                value={count}
                onChange={(ev) => setCount(Number(ev.target.value))}
                className={`${inputClass} w-24`}
              />
            </label>
            <RadioGroup
              legend="Spacing"
              name={`split-mode-${ownerName}`}
              value={mode}
              options={[
                { value: 'even', label: 'Even' },
                { value: 'custom', label: 'Custom times' },
              ]}
              onChange={setMode}
            />
            <button
              type="button"
              className={smallButtonClass}
              disabled={!valid || count < 1 || count > MAX_SPLIT}
              onClick={() => onSplit(count, mode)}
            >
              Split into subphases
            </button>
          </div>
          {!valid && <p className="text-meta">Set a start and end first.</p>}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-meta">
            {subphases.length} subphase{subphases.length === 1 ? '' : 's'}, {split === 'even' ? 'evenly spaced' : 'custom times'}. Click a
            section to edit it.
          </p>
          <button type="button" className={smallButtonClass} onClick={onRemoveAll}>
            Remove all subphases
          </button>
        </div>
      )}
    </fieldset>
  )
}
