import type { MouseEvent } from 'react'

/**
 * True when a click landed on (or inside) a control such as a chip, a "See all",
 * or the add bar, between the clicked target and the element handling it. Those
 * controls do their own thing; the folder boxes around them must not also
 * open or close.
 */
export function isFromControl(event: MouseEvent<Element>): boolean {
  const target = event.target as Element | null
  const control = target?.closest('button, a, input, select, textarea, [role="button"]')
  return control != null && event.currentTarget.contains(control) && control !== event.currentTarget
}
