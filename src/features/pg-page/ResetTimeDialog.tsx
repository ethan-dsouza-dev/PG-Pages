import * as Dialog from '@radix-ui/react-dialog'
import { useId, useState, type FormEvent, type RefObject } from 'react'
import { formatResetTime, isResetTime } from '../../domain/dailyReset'
import { TextLink } from '../../ui'

type ResetTimeDialogProps = {
  open: boolean
  resetTime: string
  onOpenChange: (open: boolean) => void
  onSave: (resetTime: string) => void
  /** The control that opened the dialog; focus goes back to it on close. */
  returnFocusRef: RefObject<HTMLElement | null>
}

/** LP-5.2: pick the local time at which the page's daily items reset. */
export function ResetTimeDialog({
  open,
  resetTime,
  onOpenChange,
  onSave,
  returnFocusRef,
}: ResetTimeDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-overlay" />
        <Dialog.Content
          onCloseAutoFocus={(event) => {
            // No Dialog.Trigger here, so Radix can't find the opener by itself.
            event.preventDefault()
            returnFocusRef.current?.focus()
          }}
          className="fixed top-1/2 left-1/2 flex w-128 max-w-[90vw] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-panel border-2 border-border-strong bg-surface-panel p-8 font-body text-text"
        >
          {/* Remounted on each open so the draft starts from the saved time. */}
          {open && (
            <ResetTimeForm
              resetTime={resetTime}
              onCancel={() => onOpenChange(false)}
              onSave={onSave}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

type ResetTimeFormProps = {
  resetTime: string
  onCancel: () => void
  onSave: (resetTime: string) => void
}

function ResetTimeForm({ resetTime, onCancel, onSave }: ResetTimeFormProps) {
  const inputId = useId()
  const [draft, setDraft] = useState(resetTime)
  const valid = isResetTime(draft)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (valid) onSave(draft)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <Dialog.Title className="text-section">Change reset time</Dialog.Title>
        <Dialog.Description className="text-meta">
          Every day at this time, tasks, day goals and themes return to unchecked. Month goals reset at this time on the 1st. Currently{' '}
          {formatResetTime(resetTime)}.
        </Dialog.Description>
      </div>
      <label htmlFor={inputId} className="flex flex-col gap-2 text-label">
        Reset time
        <input
          id={inputId}
          type="time"
          required
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="interactive w-48 rounded-chip border-2 border-border-strong bg-surface-base px-3 py-1 text-label"
        />
      </label>
      <div className="flex justify-end gap-6">
        <TextLink size="label" onClick={onCancel}>
          Cancel
        </TextLink>
        <button
          type="submit"
          disabled={!valid}
          className="interactive text-label underline decoration-2 underline-offset-4 disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </form>
  )
}
