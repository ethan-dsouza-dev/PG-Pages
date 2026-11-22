import { evenSplit, phaseDisplayName, type PhaseDraft } from '../../domain/taskForm'
import type { SplitMode } from '../../domain/types'
import { Field } from './formControls'
import { inputClass, smallButtonClass } from './fieldContext'
import { MilestoneFields } from './MilestoneFields'
import { SubphaseSection } from './SubphaseSection'

/** "Sun 22 Nov, 14:20 – 14:40" for two local date-times. */
function describeLocalSpan(start: string, end: string): string {
  const fmt = (v: string, withDay: boolean) => {
    const [y, m, d] = v.slice(0, 10).split('-').map(Number)
    const day = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
    return withDay ? `${day}, ${v.slice(11, 16)}` : v.slice(11, 16)
  }
  const sameDay = start.slice(0, 10) === end.slice(0, 10)
  return `${fmt(start, true)} – ${fmt(end, !sameDay)}`
}

type SubphasePanelProps = {
  phase: PhaseDraft
  /** Position among its siblings, for the "Phase n" fallback name. */
  index: number
  /** Names from the task down to this subphase's parent, for the breadcrumb (TW-4.3). */
  trail: string[]
  /** Whether the parent was split with custom times; even splits fix the times (TW-4.4). */
  parentSplit?: SplitMode
  timeZone: string
  newId: () => string
  onChange: (update: (p: PhaseDraft) => PhaseDraft) => void
  onBack: () => void
  /** Jumps to the trail entry at this depth (0 = the task). */
  onJump: (depth: number) => void
  onOpenChild: (childId: string) => void
  onDelete: () => void
}

/** TW-4.3 / TW-4.4: one subphase's own panel inside the task window. */
export function SubphasePanel(props: SubphasePanelProps) {
  const { phase, index, trail, parentSplit, timeZone, newId, onChange, onBack, onJump, onOpenChild, onDelete } = props
  const name = phaseDisplayName(phase, index)
  const patch = (p: Partial<PhaseDraft>) => onChange((old) => ({ ...old, ...p }))

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={smallButtonClass} onClick={onBack}>
          <span aria-hidden="true">‹ </span>Back
        </button>
        <nav aria-label="Subphase path">
          <ol className="flex flex-wrap items-center gap-1 text-meta">
            {trail.map((t, depth) => (
              <li key={`${depth}-${t}`} className="flex items-center gap-1">
                <button type="button" className="interactive underline underline-offset-2" onClick={() => onJump(depth)}>
                  {t}
                </button>
                <span aria-hidden="true">›</span>
              </li>
            ))}
            <li aria-current="page" className="font-medium">
              {name}
            </li>
          </ol>
        </nav>
      </div>

      <Field name={`phase-title:${phase.id}`} label="Label (optional)">
        {(p) => (
          <input {...p} value={phase.title} placeholder={name} onChange={(e) => patch({ title: e.target.value })} className={inputClass} />
        )}
      </Field>
      <Field name={`phase-member:${phase.id}`} label="Member assigned (optional)">
        {(p) => <input {...p} value={phase.member} onChange={(e) => patch({ member: e.target.value })} className={inputClass} />}
      </Field>

      {parentSplit === 'custom' ? (
        <div className="grid grid-cols-2 gap-4">
          <Field name={`phase:${phase.id}`} label="Starts">
            {(p) => (
              <input
                {...p}
                type="datetime-local"
                value={phase.start}
                onChange={(e) => patch({ start: e.target.value })}
                className={inputClass}
              />
            )}
          </Field>
          <Field name={`phase-end:${phase.id}`} label="Ends">
            {(p) => (
              <input {...p} type="datetime-local" value={phase.end} onChange={(e) => patch({ end: e.target.value })} className={inputClass} />
            )}
          </Field>
        </div>
      ) : (
        <p className="text-meta">
          Evenly spaced: {describeLocalSpan(phase.start, phase.end)}. Choose custom times on the parent to change it.
        </p>
      )}

      <MilestoneFields
        milestones={phase.milestones}
        defaultAt={phase.start}
        newId={newId}
        onChange={(milestones) => patch({ milestones })}
      />

      <SubphaseSection
        start={phase.start}
        end={phase.end}
        timeZone={timeZone}
        subphases={phase.subphases}
        split={phase.split}
        milestones={phase.milestones}
        ownerName={name}
        onSplit={(count, mode) => patch({ split: mode, subphases: evenSplit(phase.start, phase.end, count, timeZone, newId) })}
        onOpen={onOpenChild}
        onRemoveAll={() => patch({ subphases: [], split: undefined })}
      />

      <div>
        <button type="button" className={smallButtonClass} onClick={onDelete}>
          Delete this subphase
        </button>
      </div>
    </div>
  )
}
