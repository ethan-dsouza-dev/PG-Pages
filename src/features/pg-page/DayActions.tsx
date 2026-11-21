import { useRef, useState } from 'react'
import { formatResetTime } from '../../domain/dailyReset'
import { usePGPageActions, useResetTime } from '../../store/pgPageStore'
import { TextLink } from '../../ui'
import { ResetTimeDialog } from './ResetTimeDialog'

/**
 * Select Task(s), Change Reset Time, Reset Day, and Check All. The day actions
 * apply to the real today, not the day scrolled into view on the timeline.
 */
export function DayActions() {
  const { checkAll, resetDay, setResetTime } = usePGPageActions()
  const resetTime = useResetTime()
  const [announcement, setAnnouncement] = useState('')
  const [resetTimeOpen, setResetTimeOpen] = useState(false)
  const resetTimeTrigger = useRef<HTMLButtonElement>(null)

  return (
    <div className="grid grid-cols-3 items-start px-12">
      {/* PLACEHOLDER(06): behavior is undecided (OQ-3). */}
      <TextLink placeholder className="col-start-2 justify-self-center whitespace-nowrap">
        Select Task(s)
      </TextLink>
      <div className="flex flex-col items-end gap-6">
        <div className="flex flex-col items-end gap-1 whitespace-nowrap">
          <TextLink
            onClick={() => {
              resetDay(new Date())
              setAnnouncement("Today's tasks and day goals reset to to do")
            }}
          >
            Reset Day
          </TextLink>
          <TextLink ref={resetTimeTrigger} size="meta" onClick={() => setResetTimeOpen(true)}>
            Change Reset Time
          </TextLink>
        </div>
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
      <ResetTimeDialog
        open={resetTimeOpen}
        resetTime={resetTime}
        onOpenChange={setResetTimeOpen}
        returnFocusRef={resetTimeTrigger}
        onSave={(next) => {
          setResetTime(next, new Date())
          setResetTimeOpen(false)
          setAnnouncement(`Daily reset time set to ${formatResetTime(next)}`)
        }}
      />
    </div>
  )
}
