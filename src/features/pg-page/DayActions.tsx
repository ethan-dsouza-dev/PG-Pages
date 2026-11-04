import { useState } from 'react'
import { usePGPageActions } from '../../store/pgPageStore'
import { TextLink } from '../../ui'

/**
 * Select Task(s), Reset Day, and Check All. The day actions apply to the real
 * today, not the day scrolled into view on the timeline.
 */
export function DayActions() {
  const { checkAll, resetDay } = usePGPageActions()
  const [announcement, setAnnouncement] = useState('')

  return (
    <div className="grid grid-cols-3 items-start px-12">
      {/* PLACEHOLDER(06): behavior is undecided (OQ-3). */}
      <TextLink placeholder className="col-start-2 justify-self-center">
        Select Task(s)
      </TextLink>
      <div className="flex flex-col items-end gap-6">
        <TextLink
          onClick={() => {
            resetDay(new Date())
            setAnnouncement("Today's tasks and day goals reset to to do")
          }}
        >
          Reset Day
        </TextLink>
        <TextLink
          onClick={() => {
            checkAll(new Date())
            setAnnouncement("All of today's tasks and day goals marked complete")
          }}
        >
          Check All
        </TextLink>
      </div>
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}
