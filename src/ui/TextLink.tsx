import type { Ref } from 'react'
import { cx } from './cx'
import { ComingSoonHint } from './ComingSoonHint'
import { logPlaceholder, placeholderAttrs } from './placeholder'

type TextLinkSize = 'nav' | 'label' | 'meta'

type Behavior =
  | {
      href: string
      /** Opens in a new tab, without an opener or referrer, and says so to screen readers. */
      external?: boolean
      onClick?: never
      placeholder?: never
    }
  | { onClick: () => void; disabled?: boolean; href?: never; external?: never; placeholder?: never }
  | { placeholder: true; href?: never; external?: never; onClick?: never }

type TextLinkProps = Behavior & {
  children: string
  size?: TextLinkSize
  className?: string
  /** Forwarded to the rendered <button> (ignored for links), e.g. to return focus to it. */
  ref?: Ref<HTMLButtonElement>
}

const sizeClass: Record<TextLinkSize, string> = {
  nav: 'text-nav',
  label: 'text-label',
  meta: 'text-meta',
}

/** Underlined text action. Renders <a> for `href`, otherwise a <button>. */
export function TextLink({ children, size = 'nav', className, ref, ...behavior }: TextLinkProps) {
  const classes = cx(
    'interactive inline-block text-left underline underline-offset-4 decoration-2',
    sizeClass[size],
    className,
  )

  if (behavior.href !== undefined) {
    if (behavior.external) {
      return (
        <a href={behavior.href} target="_blank" rel="noopener noreferrer" className={classes}>
          {children}
          <span className="sr-only">, opens in a new tab</span>
        </a>
      )
    }
    return (
      <a href={behavior.href} className={classes}>
        {children}
      </a>
    )
  }

  if (behavior.placeholder) {
    return (
      <button
        ref={ref}
        type="button"
        className={classes}
        {...placeholderAttrs}
        onClick={() => logPlaceholder(children)}
      >
        {children}
        <ComingSoonHint />
      </button>
    )
  }

  return (
    <button
      ref={ref}
      type="button"
      className={cx(classes, 'disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline')}
      onClick={behavior.onClick}
      disabled={behavior.disabled}
    >
      {children}
    </button>
  )
}
