import { cx } from './cx'

type ChipProps = {
  label: string
  completed: boolean
  onToggle: () => void
  className?: string
}

/** A goal pill that toggles between to-do (rust) and done (green). */
export function Chip({ label, completed, onToggle, className }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={completed}
      onClick={onToggle}
      className={cx(
        'interactive w-full truncate rounded-chip px-4 py-2.5 text-center text-label font-medium text-text-on-accent',
        completed ? 'bg-goal-done' : 'bg-goal-todo',
        className,
      )}
    >
      {label}
    </button>
  )
}
