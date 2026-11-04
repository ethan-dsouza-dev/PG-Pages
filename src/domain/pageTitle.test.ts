import { describe, expect, it } from 'vitest'
import { formatTitleLead } from './pageTitle'

describe('formatTitleLead', () => {
  it('adds a possessive and "First"', () => {
    expect(formatTitleLead('Jake')).toBe("Jake's First")
  })

  it("uses a bare apostrophe for names ending in s", () => {
    expect(formatTitleLead('James')).toBe("James' First")
  })

  it('trims whitespace', () => {
    expect(formatTitleLead('  Ana ')).toBe("Ana's First")
  })
})
