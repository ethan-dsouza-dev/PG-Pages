import { createContext, useContext } from 'react'
import type { FormErrors } from '../../domain/taskForm'

/*
 * Every task-window control gets a stable id from its error key, so Save can
 * move focus to the first problem (TW-5.2) and errors are tied to their
 * control with aria-describedby.
 */

type FieldContextValue = { prefix: string; errors: FormErrors }

export const FieldContext = createContext<FieldContextValue>({ prefix: 'tw', errors: {} })

/** The id of the control for error key `key`. */
export function controlId(prefix: string, key: string): string {
  return `${prefix}-${key.replace(/[^a-zA-Z0-9_-]/g, '-')}`
}

/** Props that wire a control to its error message. */
export function useFieldProps(key: string) {
  const { prefix, errors } = useContext(FieldContext)
  const id = controlId(prefix, key)
  const error = errors[key]
  return {
    id,
    error,
    controlProps: {
      id,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? `${id}-error` : undefined,
    } as const,
  }
}

export const inputClass =
  'interactive rounded-chip border-2 border-border-strong bg-surface-base px-3 py-1 text-label aria-invalid:border-error'

export const smallButtonClass =
  'interactive rounded-chip border-2 border-border-strong bg-surface-base px-3 py-1 text-meta disabled:cursor-not-allowed disabled:opacity-50'
