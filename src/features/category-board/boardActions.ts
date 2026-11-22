import { createContext, useContext, type ReactElement, type ReactNode } from 'react'

/**
 * What a board on the live page can do beyond toggling chips: a task menu on
 * each chip (LP-7.10) and a "+" on each folder (LP-6.11). Boards rendered
 * without this context (dev previews, unit tests) just don't show them.
 */
export type BoardActions = {
  /** Wraps a chip in its right-click menu. */
  wrapChip: (itemId: string, chip: ReactElement) => ReactNode
  /** Opens the New Task window with this folder filled in. */
  addToFolder: (folderId: string) => void
}

export const BoardActionsContext = createContext<BoardActions | null>(null)

export function useBoardActionsContext(): BoardActions | null {
  return useContext(BoardActionsContext)
}
