import { createElement, type ComponentType } from 'react'
import { AdGallerySection } from '../ad-gallery/AdGallerySection'
import { CategoryBoardSection } from '../category-board/CategoryBoardSection'
import { PGPageView } from '../pg-page/PGPageView'

export type PageSection = { id: string; Component: ComponentType }

/** A page-stack entry for one category board (all boards share one component). */
function boardSection(boardId: string): PageSection {
  const Component = () => createElement(CategoryBoardSection, { boardId })
  Component.displayName = `CategoryBoardSection(${boardId})`
  return { id: boardId, Component }
}

/**
 * The page's sections, top to bottom. Each one is a full-bleed, labelled
 * `<section>` that paints its own background. To add a section, append it here.
 * The page footer is not a section: PageStack renders it after `<main>`.
 * TODO(OQ-18): the boards and their order are fixed until Customize exists.
 */
export const PAGE_SECTIONS: readonly PageSection[] = [
  { id: 'pg-page', Component: PGPageView },
  { id: 'ad-gallery', Component: AdGallerySection },
  boardSection('board-productivity'),
  boardSection('board-self-care'),
  boardSection('board-leisure'),
]
