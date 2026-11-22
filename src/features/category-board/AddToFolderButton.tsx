import { useBoardActionsContext } from './boardActions'

/** A small "+" next to a folder's title. Nothing without BoardActionsContext. */
export function AddToFolderButton({ folderId, title }: { folderId: string; title: string }) {
  const actions = useBoardActionsContext()
  if (!actions) return null
  return (
    <button
      type="button"
      aria-label={`Add task to ${title}`}
      title={`Add task to ${title}`}
      onClick={() => actions.addToFolder(folderId)}
      className="interactive shrink-0 rounded-add border-2 border-border-strong bg-add px-2.5 text-label leading-tight text-text-on-accent"
    >
      <span aria-hidden="true">+</span>
    </button>
  )
}
