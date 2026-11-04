import type { Ad } from './types'

/** How many ads hang on the gallery wall at once (OQ-10). */
export const GALLERY_AD_COUNT = 3

/**
 * Picks `count` distinct ads from `pool` at random (a partial Fisher–Yates
 * shuffle). Returns `min(count, pool.length)` ads and never mutates `pool`.
 * Pass a seeded `random` for deterministic results.
 */
export function pickAds(pool: readonly Ad[], count: number, random: () => number = Math.random): Ad[] {
  const picked = [...pool]
  const n = Math.max(0, Math.min(Math.floor(count), picked.length))
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(random() * (picked.length - i))
    ;[picked[i], picked[j]] = [picked[j], picked[i]]
  }
  return picked.slice(0, n)
}

/** Width over height of the ad's image. */
export function adAspectRatio(ad: Pick<Ad, 'image'>): number {
  return ad.image.width / ad.image.height
}

/** Accessible name for an ad link; it carries the sponsorship disclosure (OQ-11). */
export function adAccessibleName(ad: Pick<Ad, 'advertiser' | 'caption'>): string {
  return ad.caption ? `Advertisement: ${ad.advertiser}, ${ad.caption}` : `Advertisement: ${ad.advertiser}`
}
