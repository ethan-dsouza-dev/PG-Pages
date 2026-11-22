import type { MilestoneDraft } from '../../domain/taskForm'
import { FieldError } from './formControls'
import { inputClass, smallButtonClass, useFieldProps } from './fieldContext'

type MilestoneFieldsProps = {
  milestones: MilestoneDraft[]
  /** Where a new milestone starts: the start of the span it sits in. */
  defaultAt: string
  newId: () => string
  onChange: (milestones: MilestoneDraft[]) => void
}

/** TW-3.9: zero or more milestones, each a label and a time inside the span. */
export function MilestoneFields({ milestones, defaultAt, newId, onChange }: MilestoneFieldsProps) {
  const update = (id: string, patch: Partial<MilestoneDraft>) =>
    onChange(milestones.map((m) => (m.id === id ? { ...m, ...patch } : m)))

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-label">Milestones</legend>
      {milestones.length === 0 && <p className="text-meta">None yet.</p>}
      <ul className="flex flex-col gap-2">
        {milestones.map((m, i) => (
          <MilestoneRow
            key={m.id}
            milestone={m}
            index={i}
            onChange={(patch) => update(m.id, patch)}
            onRemove={() => onChange(milestones.filter((x) => x.id !== m.id))}
          />
        ))}
      </ul>
      <div>
        <button
          type="button"
          className={smallButtonClass}
          onClick={() => onChange([...milestones, { id: newId(), label: '', at: defaultAt }])}
        >
          Add milestone
        </button>
      </div>
    </fieldset>
  )
}

type MilestoneRowProps = {
  milestone: MilestoneDraft
  index: number
  onChange: (patch: Partial<MilestoneDraft>) => void
  onRemove: () => void
}

function MilestoneRow({ milestone, index, onChange, onRemove }: MilestoneRowProps) {
  const { id, error, controlProps } = useFieldProps(`milestone:${milestone.id}`)
  const n = index + 1
  return (
    <li className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <input
          {...controlProps}
          aria-label={`Milestone ${n} label`}
          placeholder="Label"
          value={milestone.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className={`${inputClass} min-w-0 flex-1`}
        />
        <input
          aria-label={`Milestone ${n} time`}
          type="datetime-local"
          value={milestone.at}
          onChange={(e) => onChange({ at: e.target.value })}
          className={inputClass}
        />
        <button type="button" className={smallButtonClass} onClick={onRemove} aria-label={`Remove milestone ${n}`}>
          Remove
        </button>
      </div>
      <FieldError id={id} error={error} />
    </li>
  )
}
