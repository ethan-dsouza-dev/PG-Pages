import type { Board, BoardGroup } from '../../domain/types'

/*
 * Drill-down position inside one category board (LP-7.4–7.7):
 *   null        the root view: the whole board, capped
 *   []          the category is open
 *   [g, …]      group ids from the top level down to the open folder
 */
export type FolderPath = readonly string[] | null

export const ROOT: FolderPath = null
export const CATEGORY: FolderPath = []

/**
 * The groups along `path`, top level first, or `null` when `path` is the root
 * view or names a group that does not exist (e.g. after the fixture changed).
 */
export function resolveFolderPath(board: Board, path: FolderPath): BoardGroup[] | null {
  if (path === null) return null
  const trail: BoardGroup[] = []
  let level: readonly BoardGroup[] = board.groups
  for (const id of path) {
    const group = level.find((g) => g.id === id)
    if (!group) return null
    trail.push(group)
    level = group.children ?? []
  }
  return trail
}

/** One level up: group → parent group → category → root. The root stays put. */
export function parentPath(path: FolderPath): FolderPath {
  if (path === null || path.length === 0) return ROOT
  return path.slice(0, -1)
}

/** A folder with no child folders: shown uncapped once open (LP-7.6). */
export function isLeaf(group: BoardGroup): boolean {
  return (group.children?.length ?? 0) === 0
}
