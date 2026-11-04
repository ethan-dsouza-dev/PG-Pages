import { TimelinePanel } from '../timeline/TimelinePanel'
import { DayActions } from './DayActions'
import { GoalSections } from './GoalSections'
import { PageHeader } from './PageHeader'
import { PageLinks } from './PageLinks'

/** Page layout: header column beside the timeline, then actions and goal sections. */
export function PGPageView() {
  return (
    <main className="mx-auto grid max-w-page grid-cols-[minmax(20rem,2fr)_minmax(0,4.5fr)] gap-x-12 gap-y-10 px-16 py-10">
      <div className="flex flex-col justify-between pt-4">
        <PageHeader />
        <PageLinks />
      </div>

      <TimelinePanel />

      <div className="col-start-2">
        <DayActions />
      </div>

      <div className="col-span-2">
        <GoalSections />
      </div>
    </main>
  )
}
