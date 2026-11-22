import { useContext, type ReactNode } from 'react'
import { cx } from '../../ui'
import { FieldContext, useFieldProps } from './fieldContext'

/*
 * Small building blocks shared by the task window's fields. Every control gets
 * a stable id from its error key, so Save can move focus to the first problem
 * (TW-5.2) and errors are tied to their control with aria-describedby.
 */

export function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null
  return (
    <p id={`${id}-error`} className="border-l-4 border-error pl-2 text-meta">
      {error}
    </p>
  )
}

type FieldProps = {
  /** Error key; also names the control (see useFieldProps). */
  name: string
  label: string
  children: (controlProps: ReturnType<typeof useFieldProps>['controlProps']) => ReactNode
  hint?: string
  className?: string
}

/** A labelled control with its error underneath. */
export function Field({ name, label, children, hint, className }: FieldProps) {
  const { id, error, controlProps } = useFieldProps(name)
  return (
    <div className={cx('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="text-label">
        {label}
      </label>
      {hint && <p className="text-meta">{hint}</p>}
      {children(controlProps)}
      <FieldError id={id} error={error} />
    </div>
  )
}

/** A fieldset of radio buttons. */
export function RadioGroup<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
}: {
  legend: string
  name: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  const { prefix } = useContext(FieldContext)
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="text-label">{legend}</legend>
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 text-label">
            <input
              type="radio"
              name={`${prefix}-${name}`}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="interactive size-4 accent-text"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
