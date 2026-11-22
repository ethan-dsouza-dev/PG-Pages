import type { FormTiming, ItemForm } from '../../domain/taskForm'
import { Field, RadioGroup } from './formControls'
import { inputClass } from './fieldContext'

type TimingFieldsProps = {
  form: ItemForm
  /** Goals may have no time at all (TW-3.2a). */
  allowNone: boolean
  onTiming: (timing: FormTiming) => void
  onChange: (patch: Partial<ItemForm>) => void
}

const TIMING_OPTIONS: { value: FormTiming; label: string }[] = [
  { value: 'timed', label: 'Timed' },
  { value: 'all-day', label: 'All Day' },
  { value: 'untimed', label: 'Not timed' },
]

/** TW-3.7: Timed (start and end), All Day (first and last day), or Not timed (a day). */
export function TimingFields({ form, allowNone, onTiming, onChange }: TimingFieldsProps) {
  const options = allowNone ? [{ value: 'none' as const, label: 'No time' }, ...TIMING_OPTIONS] : TIMING_OPTIONS
  return (
    <div className="flex flex-col gap-3">
      <RadioGroup legend="When" name="timing" value={form.timing} options={options} onChange={onTiming} />
      {form.timing === 'timed' && (
        <div className="grid grid-cols-2 gap-4">
          <Field name="start" label="Starts">
            {(p) => (
              <input
                {...p}
                type="datetime-local"
                value={form.start}
                onChange={(e) => onChange({ start: e.target.value })}
                className={inputClass}
              />
            )}
          </Field>
          <Field name="end" label="Ends">
            {(p) => (
              <input
                {...p}
                type="datetime-local"
                value={form.end}
                onChange={(e) => onChange({ end: e.target.value })}
                className={inputClass}
              />
            )}
          </Field>
        </div>
      )}
      {form.timing === 'all-day' && (
        <div className="grid grid-cols-2 gap-4">
          <Field name="start" label="First day">
            {(p) => (
              <input {...p} type="date" value={form.start} onChange={(e) => onChange({ start: e.target.value })} className={inputClass} />
            )}
          </Field>
          <Field name="end" label="Last day">
            {(p) => (
              <input {...p} type="date" value={form.end} onChange={(e) => onChange({ end: e.target.value })} className={inputClass} />
            )}
          </Field>
        </div>
      )}
      {form.timing === 'untimed' && (
        <Field name="start" label="Day">
          {(p) => (
            <input
              {...p}
              type="date"
              value={form.start}
              onChange={(e) => onChange({ start: e.target.value, end: e.target.value })}
              className={`${inputClass} w-56`}
            />
          )}
        </Field>
      )}
    </div>
  )
}
