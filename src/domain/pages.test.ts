import { describe, expect, it } from 'vitest'
import { createMockPage } from '../data/mock/pgPage'
import {
  PAGE_NAME_MAX_LENGTH,
  activePage,
  addEmptyPage,
  collectionOf,
  displayName,
  nextDefaultName,
  renamePage,
  switchPage,
  updateActivePage,
} from './pages'

const mock = () => createMockPage(new Date('2026-10-10T17:00:00Z'), 'UTC')

describe('pages', () => {
  it('addEmptyPage adds a blank page with a fresh id and shows it', () => {
    const start = collectionOf(mock())
    const next = addEmptyPage(start, 'p2')

    expect(next.pages).toHaveLength(2)
    expect(next.activePageId).toBe('p2')
    const added = activePage(next)
    expect(added).toMatchObject({ id: 'p2', name: 'Untitled', ownerName: 'Jake', version: 1, timeZone: 'UTC' })
    expect(added.goals).toEqual([])
    expect(added.tasks).toEqual([])
    expect(next.pages[0]).toBe(start.pages[0])
  })

  it('numbers default names so the switcher can tell them apart', () => {
    let c = collectionOf(mock())
    c = addEmptyPage(c, 'a')
    c = addEmptyPage(c, 'b')
    expect(c.pages.map((p) => p.name)).toEqual(["Jake's First", 'Untitled', 'Untitled 2'])
    expect(nextDefaultName(c.pages)).toBe('Untitled 3')
  })

  it('switchPage shows a known page and ignores unknown or current ids', () => {
    const c = addEmptyPage(collectionOf(mock()), 'p2')
    expect(switchPage(c, 'jakes-first-pg-page').activePageId).toBe('jakes-first-pg-page')
    expect(switchPage(c, 'nope')).toBe(c)
    expect(switchPage(c, 'p2')).toBe(c)
  })

  it('updateActivePage changes only the shown page', () => {
    const c = switchPage(addEmptyPage(collectionOf(mock()), 'p2'), 'jakes-first-pg-page')
    const next = updateActivePage(c, (p) => renamePage(p, 'Fall term'))
    expect(next.pages[0].name).toBe('Fall term')
    expect(next.pages[1]).toBe(c.pages[1])
    expect(updateActivePage(next, (p) => p)).toBe(next)
  })

  it('renamePage caps the length and keeps the page when unchanged', () => {
    const p = mock()
    expect(renamePage(p, p.name)).toBe(p)
    expect(renamePage(p, 'x'.repeat(100)).name).toHaveLength(PAGE_NAME_MAX_LENGTH)
    expect(renamePage(p, '').name).toBe('')
  })

  it('displayName falls back to the default for blank names', () => {
    expect(displayName({ name: '  ' })).toBe('Untitled')
    expect(displayName({ name: ' Fall ' })).toBe('Fall')
  })

  it('activePage falls back to the first page for a stale id', () => {
    const c = collectionOf(mock())
    expect(activePage({ ...c, activePageId: 'gone' })).toBe(c.pages[0])
  })
})
