import { presetRule, WEEKDAY_SHORT } from '../../domain/repeat'
import type { RepeatPreset, RepeatRule, RepeatUnit, Weekday } from '../../domain/types'
import { FieldError, RadioGroup } from './formControls'
import { inputClass, useFieldProps } from './fieldContext'

type RepeatChoice = 'never' | RepeatPreset

const CHOICES: { value: RepeatChoice; label: string }[] = [
  { value: 'never', label: 'Never' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
]

const UNITS: { value: RepeatUnit; label: string }[] = [
  { value: 'day', label: 'days' },
  { value: 'week', label: 'weeks' },
  { value: 'month', label: 'months' },
]

type RepeatFieldsProps = {
  repeat: RepeatRule | null
  /** The first occurrence's day ('YYYY-MM-DD'), the default "ends on" date. */
  startDay: string
  onChange: (repeat: RepeatRule | null) => void
}

/** TW-3.8: Never, Daily, Weekly, Monthly, or Custom, and when it ends. */
export function RepeatFields({ repeat, startDay, onChange }: RepeatFieldsProps) {
  const { id, error, controlProps } = useFieldProps('repeat')
  const choice: RepeatChoice = repeat?.preset ?? 'never'

  const pick = (next: RepeatChoice) => {
    if (next === 'never') return onChange(null)
    const ends = repeat?.ends ?? { type: 'never' as const }
    if (next === 'custom') {
      return onChange({
        preset: 'custom',
        every: repeat?.every ?? 1,
        unit: repeat?.unit ?? 'week',
        ...(repeat?.weekdays ? { weekdays: repeat.weekdays } : {}),
        ends,
      })
    }
    onChange({ ...presetRule(next), ends })
  }

  const patch = (p: Partial<RepeatRule>) => {
    if (repeat) onChange({ ...repeat, ...p })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-label">
          Repeat
        </label>
        <select {...controlProps} value={choice} onChange={(e) => pick(e.target.value as RepeatChoice)} className={`${inputClass} w-56`}>
          {CHOICES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {repeat?.preset === 'custom' && (
        <div className="flex flex-col gap-3 border-l-4 border-border-strong pl-4">
          <div className="flex items-center gap-3 text-label">
            <label htmlFor={`${id}-every`}>Every</label>
            <input
              id={`${id}-every`}
              type="number"
              min={1}
              max={99}
              value={repeat.every}
              onChange={(e) => patch({ every: Number(e.target.value) })}
              className={`${inputClass} w-24`}
            />
            <label className="sr-only" htmlFor={`${id}-unit`}>
              Unit
            </label>
            <select
              id={`${id}-unit`}
              value={repeat.unit}
              onChange={(e) => {
                const unit = e.target.value as RepeatUnit
                onChange({ ...repeat, unit, weekdays: unit === 'week' ? repeat.weekdays : undefined })
              }}
              className={inputClass}
            >
              {UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          {repeat.unit === 'week' && (
            <fieldset className="flex flex-col gap-1">
              <legend className="text-label">On</legend>
              <div className="flex flex-wrap gap-3">
                {WEEKDAY_SHORT.map((name, d) => {
                  const day = d as Weekday
                  const checked = repeat.weekdays?.includes(day) ?? false
                  const toggle = () =>
                    patch({
                      weekdays: checked
                        ? repeat.weekdays?.filter((w) => w !== day)
                        : [...(repeat.weekdays ?? []), day].sort((a, b) => a - b),
                    })
                  return (
                    <label key={name} className="flex items-center gap-1 text-label">
                      <input type="checkbox" checked={checked} onChange={toggle} className="interactive size-4 accent-text" />
                      {name}
                    </label>
                  )
                })}
              </div>
            </fieldset>
          )}
        </div>
      )}

      {repeat && (
        <div className="flex flex-col gap-2">
          <RadioGroup
            legend="Ends"
            name="repeat-ends"
            value={repeat.ends.type}
            options={[
              { value: 'never', label: 'Never' },
              { value: 'on', label: 'On a date' },
              { value: 'after', label: 'After a number of times' },
            ]}
            onChange={(type) =>
              patch({ ends: type === 'never' ? { type } : type === 'on' ? { type, date: startDay } : { type, count: 10 } })
            }
          />
          {repeat.ends.type === 'on' && (
            <label className="flex items-center gap-2 text-label">
              Last day
              <input
                type="date"
                value={repeat.ends.date}
                onChange={(e) => patch({ ends: { type: 'on', date: e.target.value } })}
                className={inputClass}
              />
            </label>
          )}
          {repeat.ends.type === 'after' && (
            <label className="flex items-center gap-2 text-label">
              Times
              <input
                type="number"
                min={1}
                max={500}
                value={repeat.ends.count}
                onChange={(e) => patch({ ends: { type: 'after', count: Number(e.target.value) } })}
                className={`${inputClass} w-24`}
              />
            </label>
          )}
        </div>
      )}
      <FieldError id={id} error={error} />
    </div>
  )
}
