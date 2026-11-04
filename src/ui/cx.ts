/** Joins class names, skipping falsy values. Stand-in for `clsx` (no new dependency). */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
