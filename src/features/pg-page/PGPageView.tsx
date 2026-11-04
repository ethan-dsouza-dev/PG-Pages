import { TimelinePanel } from '../timeline/TimelinePanel'
import { DayActions } from './DayActions'
import { GoalSections } from './GoalSections'
import { PageHeader } from './PageHeader'
import { PageLinks } from './PageLinks'

const TITLE_ID = 'pg-page-title'

/**
 * The PG Page section of the page stack. It paints its own full-bleed yellow,
 * then lays out the header column beside the timeline, then actions and goals.
 */
export function PGPageView() {
  return (
    <section aria-labelledby={TITLE_ID} className="bg-surface-page">
      <div className="mx-auto grid max-w-page grid-cols-[minmax(20rem,2fr)_minmax(0,4.5fr)] gap-x-12 gap-y-10 px-16 py-10">
        <div className="flex flex-col justify-between pt-4">
          <PageHeader titleId={TITLE_ID} />
          <PageLinks />
        </div>

        <TimelinePanel />

        <div className="col-start-2">
          <DayActions />
        </div>

        {/* Pulled up so "Goals for the day" sits level with Check All, as in the mockup. */}
        <div className="col-span-2 -mt-20">
          <GoalSections />
        </div>
      </div>
    </section>
  )
}
