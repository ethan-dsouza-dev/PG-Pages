import { describe, expect, it } from 'vitest'
import { changeWallAd, pickAds, pickReplacementAd } from './ads'
import type { Ad } from './types'

const pool: Ad[] = Array.from({ length: 8 }, (_, i) => ({
  id: `ad-${i}`,
  advertiser: `Advertiser ${i}`,
  image: { src: `/ads/${i}.svg`, alt: '', width: 100, height: 100 },
  description: `About advertiser ${i}`,
  advertiserUrl: `https://example.com/${i}`,
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

describe('pickReplacementAd', () => {
  const wall = pool.slice(0, 3)

  it('picks an ad that is not already on the wall', () => {
    for (let seed = 0; seed < 50; seed++) {
      const ad = pickReplacementAd(pool, wall, 1, seeded(seed))
      expect(ad).toBeDefined()
      expect(wall).not.toContain(ad)
      expect(pool).toContain(ad)
    }
  })

  it('can pick any ad off the wall', () => {
    const picked = new Set(Array.from({ length: 50 }, (_, s) => pickReplacementAd(pool, wall, 0, seeded(s))?.id))
    expect(picked).toEqual(new Set(pool.slice(3).map((a) => a.id)))
  })

  it('returns undefined when every ad is already on the wall', () => {
    expect(pickReplacementAd(wall, wall, 0)).toBeUndefined()
    expect(pickReplacementAd(pool.slice(0, 2), wall, 0)).toBeUndefined()
  })

  it('returns undefined for a slot with no ad', () => {
    expect(pickReplacementAd(pool, wall, 3)).toBeUndefined()
    expect(pickReplacementAd(pool, wall, -1)).toBeUndefined()
  })
})

describe('changeWallAd', () => {
  const wall = pool.slice(0, 3)

  it('swaps only the given slot, keeping the wall distinct', () => {
    const next = changeWallAd(pool, wall, 2, () => 0)
    expect(next).not.toBe(wall)
    expect(next.map((a) => a.id)).toEqual(['ad-0', 'ad-1', 'ad-3'])
    expect(next[0]).toBe(wall[0])
    expect(wall.map((a) => a.id)).toEqual(['ad-0', 'ad-1', 'ad-2'])
  })

  it('returns the same wall when there is nothing to swap in', () => {
    expect(changeWallAd(wall, wall, 0)).toBe(wall)
    expect(changeWallAd(pool, wall, 5)).toBe(wall)
  })
})
