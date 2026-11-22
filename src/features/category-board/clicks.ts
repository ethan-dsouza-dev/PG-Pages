import type { MouseEvent } from 'react'

/**
 * True when a click landed on (or inside) a control such as a chip, a "See all",
 * or the add bar, between the clicked target and the element handling it. Those
 * controls do their own thing; the folder boxes around them must not also
 * open or close.
 */
export function isFromControl(event: MouseEvent<Element>): boolean {
  const target = event.target as Element | null
  // Clicks in a portal (a chip's menu, a dialog) bubble through React to the
  // board without being inside it in the DOM. They are never folder clicks.
  if (!target || !event.currentTarget.contains(target)) return true
  const control = target?.closest('button, a, input, select, textarea, [role="button"]')
  return control != null && event.currentTarget.contains(control) && control !== event.currentTarget
}
