import { describe, expect, it } from 'vitest'
import { pickAds } from './ads'
import type { Ad } from './types'

const pool: Ad[] = Array.from({ length: 8 }, (_, i) => ({
  id: `ad-${i}`,
  advertiser: `Advertiser ${i}`,
  image: { src: `/ads/${i}.svg`, alt: '', width: 100, height: 100 },
  href: `https://example.com/${i}`,
}))

/** Small seeded PRNG (mulberry32) so picks are reproducible. */
function seeded(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('pickAds', () => {
  it('returns the requested number of distinct ads from the pool', () => {
    for (let seed = 0; seed < 50; seed++) {
      const picked = pickAds(pool, 3, seeded(seed))
      expect(picked).toHaveLength(3)
      expect(new Set(picked.map((a) => a.id)).size).toBe(3)
      for (const ad of picked) expect(pool).toContain(ad)
    }
  })

  it('returns min(count, pool.length) ads', () => {
    expect(pickAds(pool.slice(0, 2), 3)).toHaveLength(2)
    expect(pickAds(pool, 0)).toEqual([])
    expect(pickAds([], 3)).toEqual([])
    expect(pickAds(pool, 20)).toHaveLength(8)
  })

  it('is stable for a fixed seed', () => {
    const ids = (seed: number) => pickAds(pool, 3, seeded(seed)).map((a) => a.id)
    expect(ids(42)).toEqual(ids(42))
    expect(ids(7)).toEqual(ids(7))
  })

  it('uses the random source, so different seeds give different sets', () => {
    const sets = new Set(Array.from({ length: 20 }, (_, s) => pickAds(pool, 3, seeded(s)).map((a) => a.id).join()))
    expect(sets.size).toBeGreaterThan(1)
  })

  it('does not mutate the pool', () => {
    const before = pool.map((a) => a.id)
    pickAds(pool, 3, seeded(1))
    expect(pool.map((a) => a.id)).toEqual(before)
  })

  it('stays in bounds when random() returns its extremes', () => {
    expect(pickAds(pool, 3, () => 0).map((a) => a.id)).toEqual(['ad-0', 'ad-1', 'ad-2'])
    expect(new Set(pickAds(pool, 3, () => 0.999999).map((a) => a.id)).size).toBe(3)
  })
})
