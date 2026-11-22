import { emptyBoards } from './boardTasks'
import type { PGPage } from './types'

/*
 * The user's PG Pages (LP-2.2, LP-2.3): an ordered list plus the one being
 * shown. Pure functions so the store stays a thin wrapper.
 */

export type PageCollection = {
  /** Every PG Page, in creation order (the order "Your PG Pages" lists them). */
  pages: PGPage[]
  activePageId: string
}

export const DEFAULT_PAGE_NAME = 'Untitled'
/** Longest page name the text box accepts (LP-2.1). */
export const PAGE_NAME_MAX_LENGTH = 40

/** A collection holding just `page`, shown. */
export function collectionOf(page: PGPage): PageCollection {
  return { pages: [page], activePageId: page.id }
}

/** The shown page. Falls back to the first page if the id is stale. */
export function activePage(c: PageCollection): PGPage {
  return c.pages.find((p) => p.id === c.activePageId) ?? c.pages[0]
}

/** "Untitled", then "Untitled 2", "Untitled 3"… skipping names already taken. */
export function nextDefaultName(pages: readonly PGPage[]): string {
  const taken = new Set(pages.map((p) => p.name.trim()))
  if (!taken.has(DEFAULT_PAGE_NAME)) return DEFAULT_PAGE_NAME
  let n = 2
  while (taken.has(`${DEFAULT_PAGE_NAME} ${n}`)) n++
  return `${DEFAULT_PAGE_NAME} ${n}`
}

/** What to call a page wherever it is shown: its name, or the default if blank. */
export function displayName(page: Pick<PGPage, 'name'>): string {
  return page.name.trim() || DEFAULT_PAGE_NAME
}

/**
 * Adds a new, empty page (no goals or tasks) and shows it. Owner and time zone
 * carry over from the page that was showing.
 */
export function addEmptyPage(c: PageCollection, id: string): PageCollection {
  const from = activePage(c)
  const page: PGPage = {
    id,
    ownerName: from.ownerName,
    name: nextDefaultName(c.pages),
    version: 1,
    timeZone: from.timeZone,
    // Reset settings carry over too; nothing is checked yet, so the last reset can as well.
    resetTime: from.resetTime,
    lastResetAt: from.lastResetAt,
    goals: [],
    tasks: [],
    boards: emptyBoards(id),
  }
  return { pages: [...c.pages, page], activePageId: id }
}

/** Shows another page. Unknown ids are ignored. */
export function switchPage(c: PageCollection, pageId: string): PageCollection {
  if (pageId === c.activePageId || !c.pages.some((p) => p.id === pageId)) return c
  return { ...c, activePageId: pageId }
}

/** Applies `update` to the shown page only; every other page keeps its reference. */
export function updateActivePage(c: PageCollection, update: (page: PGPage) => PGPage): PageCollection {
  const current = activePage(c)
  const next = update(current)
  if (next === current) return c
  return { ...c, pages: c.pages.map((p) => (p === current ? next : p)) }
}

/** Renames a page, capped at PAGE_NAME_MAX_LENGTH. Blank is allowed while typing. */
export function renamePage(page: PGPage, name: string): PGPage {
  const capped = name.slice(0, PAGE_NAME_MAX_LENGTH)
  return capped === page.name ? page : { ...page, name: capped }
}
