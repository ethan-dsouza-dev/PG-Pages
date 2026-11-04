import type { ComponentProps } from 'react'
import { cx } from './cx'

/** The rounded grey card that hosts the timeline. */
export function Panel({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cx('rounded-panel bg-surface-panel', className)} {...props} />
}
