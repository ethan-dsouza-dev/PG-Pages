import * as Dialog from '@radix-ui/react-dialog'
import type { TimelineWindow } from '../../domain/timeline'
import { describeSpan } from '../../domain/timelineFormat'
import type { Phase } from '../../domain/types'
import { TextLink } from '../../ui'

export type OpenPhase = { phase: Phase; taskTitle: string }

type PhaseDetailProps = {
  open: OpenPhase | null
  window: TimelineWindow
  onClose: () => void
  /** Called instead of Radix's default focus return, since the trigger is an SVG element. */
  onCloseAutoFocus: (event: Event) => void
}

/**
 * Expanded phase view. PLACEHOLDER(05): the real design is undecided (OQ-2),
 * so this only lists the phase's time range and nested sub-phases.
 */
export function PhaseDetail({ open, window, onClose, onCloseAutoFocus }: PhaseDetailProps) {
  return (
    <Dialog.Root open={open !== null} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-overlay" />
        <Dialog.Content
          onCloseAutoFocus={onCloseAutoFocus}
          className="fixed top-1/2 left-1/2 flex w-128 max-w-[90vw] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-panel border-2 border-border-strong bg-surface-panel p-8 font-body text-text"
        >
          {open && (
            <>
              <div>
                <Dialog.Title className="text-section">{open.phase.title}</Dialog.Title>
                <p className="text-meta">
                  Phase of {open.taskTitle} · {describeSpan(open.phase, window)}
                </p>
              </div>
              <Dialog.Description className="text-meta italic">
                Expanded phase view: design pending.
              </Dialog.Description>
              {open.phase.subphases && (
                <section>
                  <h3 className="text-label font-medium">Sub-phases</h3>
                  <SubphaseList phases={open.phase.subphases} window={window} />
                </section>
              )}
              <TextLink size="label" onClick={onClose} className="self-end">
                Close
              </TextLink>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function SubphaseList({ phases, window }: { phases: Phase[]; window: TimelineWindow }) {
  return (
    <ul className="list-disc pl-6 text-meta">
      {phases.map((phase) => (
        <li key={phase.id}>
          {phase.title}: {describeSpan(phase, window)}
          {phase.subphases && <SubphaseList phases={phase.subphases} window={window} />}
        </li>
      ))}
    </ul>
  )
}
