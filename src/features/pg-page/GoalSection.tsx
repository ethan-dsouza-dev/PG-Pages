import { useId } from 'react'
import type { GoalScope } from '../../domain/types'
import { useGoals, usePGPageActions } from '../../store/pgPageStore'
import { AddChip, Chip, SectionHeading } from '../../ui'

type GoalSectionProps = {
  title: string
  scope: GoalScope
  /** Accessible name of the "+" button, e.g. "Add day goal". */
  addLabel: string
}

/** A heading and a 4-column grid of goal chips ending in a "+" chip. */
export function GoalSection({ title, scope, addLabel }: GoalSectionProps) {
  const headingId = useId()
  const goals = useGoals(scope)
  const { toggleGoal } = usePGPageActions()

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-5">
      <SectionHeading id={headingId}>{title}</SectionHeading>
      <ul className="grid grid-cols-4 gap-x-4 gap-y-5">
        {goals.map((goal) => (
          <li key={goal.id}>
            <Chip label={goal.title} completed={goal.completed} onToggle={() => toggleGoal(goal.id)} />
          </li>
        ))}
        <li>
          {/* PLACEHOLDER(06): adding goals is out of scope. */}
          <AddChip label={addLabel} placeholder />
        </li>
      </ul>
    </section>
  )
}
