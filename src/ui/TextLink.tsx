import { cx } from './cx'
import { ComingSoonHint } from './ComingSoonHint'
import { logPlaceholder, placeholderAttrs } from './placeholder'

type TextLinkSize = 'nav' | 'label' | 'meta'

type Behavior =
  | { href: string; onClick?: never; placeholder?: never }
  | { onClick: () => void; href?: never; placeholder?: never }
  | { placeholder: true; href?: never; onClick?: never }

type TextLinkProps = Behavior & {
  children: string
  size?: TextLinkSize
  className?: string
}

const sizeClass: Record<TextLinkSize, string> = {
  nav: 'text-nav',
  label: 'text-label',
  meta: 'text-meta',
}

/** Underlined text action. Renders <a> for `href`, otherwise a <button>. */
export function TextLink({ children, size = 'nav', className, ...behavior }: TextLinkProps) {
  const classes = cx(
    'interactive inline-block text-left underline underline-offset-4 decoration-2',
    sizeClass[size],
    className,
  )

  if (behavior.href !== undefined) {
    return (
      <a href={behavior.href} className={classes}>
        {children}
      </a>
    )
  }

  if (behavior.placeholder) {
    return (
      <button
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
    <button type="button" className={classes} onClick={behavior.onClick}>
      {children}
    </button>
  )
}
