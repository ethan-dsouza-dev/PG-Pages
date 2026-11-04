import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

/** jsdom has no layout. Report a fixed 700px-wide box so measured components render. */
export const TEST_ELEMENT_WIDTH = 700

class ResizeObserverStub {
  callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }
  observe(target: Element) {
    const entry = { target, contentRect: { width: TEST_ELEMENT_WIDTH, height: 500 } }
    this.callback([entry as unknown as ResizeObserverEntry], this as unknown as ResizeObserver)
  }
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver
Element.prototype.scrollTo ??= function scrollTo() {} as Element['scrollTo']
