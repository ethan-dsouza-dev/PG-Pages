import { describe, expect, it } from 'vitest'
import { parseBooleanFlag } from './flags'

describe('parseBooleanFlag', () => {
  it('reads truthy values in any case', () => {
    for (const v of ['true', 'TRUE', '1', 'yes', 'On', ' true ']) {
      expect(parseBooleanFlag(v, false)).toBe(true)
    }
  })

  it('reads falsy values in any case', () => {
    for (const v of ['false', 'False', '0', 'no', 'OFF']) {
      expect(parseBooleanFlag(v, true)).toBe(false)
    }
  })

  it('falls back when unset, empty, or unrecognized', () => {
    expect(parseBooleanFlag(undefined, true)).toBe(true)
    expect(parseBooleanFlag('', false)).toBe(false)
    expect(parseBooleanFlag('maybe', true)).toBe(true)
  })
})
