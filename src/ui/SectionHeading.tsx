import type { ReactNode } from 'react'
import { cx } from './cx'

type SectionHeadingProps = {
  children: ReactNode
  as?: 'h2' | 'h3'
  className?: string
}

/** Section title such as "Goals for the day". */
export function SectionHeading({ children, as: Tag = 'h2', className }: SectionHeadingProps) {
  return <Tag className={cx('font-body text-section font-normal', className)}>{children}</Tag>
}
