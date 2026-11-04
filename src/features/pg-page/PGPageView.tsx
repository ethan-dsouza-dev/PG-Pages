import { cx } from '../../ui'
import { TimelinePanel } from '../timeline/TimelinePanel'
import { PageHeader } from './PageHeader'
import { PageLinks } from './PageLinks'

/** Labeled stand-in for a region a later brief fills in. */
function Slot({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cx(
        'flex items-center justify-center rounded-panel border-2 border-dashed border-border-strong text-label',
        className,
      )}
    >
      {label}
    </div>
  )
}

/** Page layout: header column beside the timeline, then actions and goal sections. */
export function PGPageView() {
  return (
    <main className="mx-auto grid max-w-page grid-cols-[minmax(20rem,2fr)_minmax(0,4.5fr)] gap-x-12 gap-y-10 px-16 py-10">
      <div className="flex flex-col justify-between pt-4">
        <PageHeader />
        <PageLinks />
      </div>

      <TimelinePanel />

      {/* Replaced by <DayActions /> in brief 06. */}
      <Slot label="Day actions (brief 06)" className="col-start-2 h-28" />

      {/* Replaced by <GoalSections /> in brief 06. */}
      <Slot label="Goal sections (brief 06)" className="col-span-2 h-150" />
    </main>
  )
}
