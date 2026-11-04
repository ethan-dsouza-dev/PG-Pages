/**
 * Helpers for controls that render but have no behavior yet (README rule 4).
 * Placeholders stay focusable, announce "coming soon", and log when used.
 */
export function logPlaceholder(name: string): void {
  console.info(`[placeholder] "${name}" is not implemented yet`)
}

export const placeholderAttrs = {
  'aria-disabled': true,
  title: 'Coming soon',
} as const
