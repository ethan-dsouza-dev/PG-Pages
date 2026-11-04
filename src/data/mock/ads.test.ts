import { describe, expect, it } from 'vitest'
import { adAspectRatio } from '../../domain/ads'
import { MOCK_ADS } from './ads'

describe('MOCK_ADS', () => {
  it('has about 8 uniquely identified ads', () => {
    expect(MOCK_ADS.length).toBeGreaterThanOrEqual(6)
    expect(new Set(MOCK_ADS.map((a) => a.id)).size).toBe(MOCK_ADS.length)
  })

  it('mixes landscape, portrait, and square shapes', () => {
    const shapes = MOCK_ADS.map((ad) => {
      const r = adAspectRatio(ad)
      return r > 1.1 ? 'landscape' : r < 0.9 ? 'portrait' : 'square'
    })
    expect(shapes.filter((s) => s === 'landscape').length).toBeGreaterThanOrEqual(2)
    expect(shapes.filter((s) => s === 'portrait').length).toBeGreaterThanOrEqual(2)
    expect(shapes).toContain('square')
  })

  it('gives every ad alt text and an intrinsic size, and about half a caption', () => {
    for (const ad of MOCK_ADS) {
      expect(ad.image.alt.length).toBeGreaterThan(10)
      expect(ad.image.width).toBeGreaterThan(0)
      expect(ad.image.height).toBeGreaterThan(0)
      expect(ad.href).toMatch(/^https:\/\//)
    }
    const captioned = MOCK_ADS.filter((a) => a.caption).length
    expect(captioned).toBeGreaterThanOrEqual(2)
    expect(captioned).toBeLessThanOrEqual(MOCK_ADS.length - 2)
  })
})
