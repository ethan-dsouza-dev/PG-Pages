import { GoalSection } from './GoalSection'

/** Day goals, month goals, and the month's themes and values. */
export function GoalSections() {
  return (
    <div className="flex flex-col gap-10">
      <GoalSection title="Goals for the day" scope="day" addLabel="Add day goal" />
      <GoalSection title="Goals for the month" scope="month" addLabel="Add month goal" />
      <GoalSection
        title="Themes and Values for the month"
        scope="theme"
        addLabel="Add theme or value"
      />
    </div>
  )
}
