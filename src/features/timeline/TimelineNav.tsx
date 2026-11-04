import { TextLink } from '../../ui'
import type { DayIndex } from './layout'

/** Last / This / Next week. PLACEHOLDER(05): behavior is undecided (OQ-4). */
export function WeekNav() {
  return (
    <div className="flex justify-between">
      <TextLink size="label" placeholder>
        Last week
      </TextLink>
      <TextLink size="label" placeholder>
        This week
      </TextLink>
      <TextLink size="label" placeholder>
        Next week
      </TextLink>
    </div>
  )
}

const DAY_NAMES = ['Yesterday', 'Today', 'Tomorrow'] as const

type DayNavProps = {
  visibleDay: DayIndex
  onNavigate: (day: DayIndex) => void
}

/** Links to the neighboring days, named relative to the real today. */
export function DayNav({ visibleDay, onNavigate }: DayNavProps) {
  const prev = visibleDay - 1
  const next = visibleDay + 1

  return (
    <div className="flex justify-between">
      {prev >= 0 ? (
        <TextLink size="label" onClick={() => onNavigate(prev as DayIndex)}>
          {DAY_NAMES[prev]}
        </TextLink>
      ) : (
        <span />
      )}
      {next <= 2 ? (
        <TextLink size="label" onClick={() => onNavigate(next as DayIndex)}>
          {DAY_NAMES[next]}
        </TextLink>
      ) : (
        <span />
      )}
    </div>
  )
}
