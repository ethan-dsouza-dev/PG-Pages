/**
 * Feature flags, read from Vite env vars at build time.
 *
 * Toggle in `.env.local` (git-ignored), then restart `npm run dev`:
 *   VITE_AUTH_ENABLED=true   # require Google sign-in before the PG Page (LP-2.5, LP-2.6)
 *   VITE_AUTH_ENABLED=false  # skip sign-in; the PG Page is usable signed-out (default)
 */

/** Parses a boolean env value. Accepts true/false, 1/0, yes/no, on/off (any case); anything else gives `fallback`. */
export function parseBooleanFlag(value: string | undefined, fallback: boolean): boolean {
  const normalized = value?.trim().toLowerCase()
  if (normalized === undefined || normalized === '') return fallback
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true
  if (['false', '0', 'no', 'off'].includes(normalized)) return false
  return fallback
}

export const flags = {
  /** When true, the landing page is gated behind sign-in. Off by default until auth is built. */
  authEnabled: parseBooleanFlag(import.meta.env.VITE_AUTH_ENABLED, false),
} as const
