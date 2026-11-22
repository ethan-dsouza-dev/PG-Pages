import * as Dialog from '@radix-ui/react-dialog'
import { useRef } from 'react'
import type { Task } from '../../domain/types'

type DeleteTaskDialogProps = {
  /** The task awaiting confirmation; null keeps the dialog closed. */
  task: Task | null
  onProceed: () => void
  onCancel: () => void
  /** Called instead of Radix's default focus return, since the trigger is an SVG element. */
  onCloseAutoFocus: (event: Event) => void
}

const buttonClass = 'interactive inline-block underline underline-offset-4 decoration-2 text-label'

/** LP-6.10: confirm before a task is permanently deleted. */
export function DeleteTaskDialog({ task, onProceed, onCancel, onCloseAutoFocus }: DeleteTaskDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  return (
    <Dialog.Root open={task !== null} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-overlay" />
        <Dialog.Content
          role="alertdialog"
          // Destructive action: start on Cancel.
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            cancelRef.current?.focus()
          }}
          onCloseAutoFocus={onCloseAutoFocus}
          className="fixed top-1/2 left-1/2 flex w-128 max-w-[90vw] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-panel border-2 border-border-strong bg-surface-panel p-8 font-body text-text"
        >
          {task && (
            <>
              <div>
                <Dialog.Title className="text-section">Are you sure?</Dialog.Title>
                <Dialog.Description className="text-label">Your task will be permanently deleted.</Dialog.Description>
                <p className="text-meta">{task.title}</p>
              </div>
              <div className="flex justify-end gap-6">
                <button type="button" className={buttonClass} onClick={onProceed}>
                  Proceed
                </button>
                <button ref={cancelRef} type="button" className={buttonClass} onClick={onCancel}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
