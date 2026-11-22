import * as Dialog from '@radix-ui/react-dialog'
import { TextLink } from '../../ui'

export type ConfirmChoice = { label: string; onSelect: () => void }

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  /** Buttons, the safest (cancel-like) one first; it gets focus. */
  choices: readonly ConfirmChoice[]
  onCancel: () => void
}

/**
 * A small alert dialog on top of the task window: unsaved changes (TW-5.3),
 * which occurrences to change (TW-6.4), deleting a subphase (TW-4.7) or an item.
 */
export function ConfirmDialog({ open, title, description, choices, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-30 bg-overlay" />
        <Dialog.Content
          role="alertdialog"
          className="fixed top-1/2 left-1/2 z-30 flex w-128 max-w-[90vw] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-panel border-2 border-border-strong bg-surface-panel p-8 font-body text-text"
        >
          <Dialog.Title className="text-section">{title}</Dialog.Title>
          <Dialog.Description className="text-meta">{description}</Dialog.Description>
          <div className="flex flex-wrap justify-end gap-6">
            {choices.map((c) => (
              <TextLink key={c.label} size="label" onClick={c.onSelect}>
                {c.label}
              </TextLink>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
