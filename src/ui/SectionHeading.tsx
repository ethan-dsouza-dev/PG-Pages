import type { ReactNode } from 'react'
import { cx } from './cx'

type SectionHeadingProps = {
  children: ReactNode
  as?: 'h2' | 'h3'
  id?: string
  className?: string
}

/** Section title such as "Goals for the day". */
export function SectionHeading({ children, as: Tag = 'h2', id, className }: SectionHeadingProps) {
  return (
    <Tag id={id} className={cx('font-body text-section font-normal', className)}>
      {children}
    </Tag>
  )
}
