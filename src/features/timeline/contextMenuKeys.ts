/* Keyboard and focus helpers for the task context menu (SVG triggers). */

/** Shift+F10 and the context-menu key open the menu from the keyboard. */
export function isContextMenuKey(event: { key: string; shiftKey: boolean }): boolean {
  return event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')
}

/**
 * Opens the context menu of a focused SVG trigger by dispatching a contextmenu
 * event at its visible top-left corner (Radix positions the menu at the event's
 * coordinates, and native keyboard contextmenu coordinates vary by browser).
 */
export function openContextMenuFromKeyboard(trigger: Element): void {
  const rect = trigger.getBoundingClientRect()
  const view = trigger.closest('[data-timeline-scroller]')?.getBoundingClientRect() ?? rect
  const left = Math.max(rect.left, view.left)
  const right = Math.min(rect.right, view.right)
  trigger.dispatchEvent(
    new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      button: 2,
      clientX: Math.min(left + 8, right),
      clientY: rect.bottom,
    }),
  )
}

/** Moves focus to the timeline scroller that contains `el` (e.g. before `el` unmounts). */
export function focusTimelineScroller(el: Element | null): void {
  el?.closest<HTMLElement>('[data-timeline-scroller]')?.focus()
}
