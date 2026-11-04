import type { ComponentType } from 'react'
import { AdGallerySection } from '../ad-gallery/AdGallerySection'
import { PGPageView } from '../pg-page/PGPageView'

export type PageSection = { id: string; Component: ComponentType }

/**
 * The page's sections, top to bottom. Each one is a full-bleed, labelled
 * `<section>` that paints its own background. To add a section, append it here.
 */
export const PAGE_SECTIONS: readonly PageSection[] = [
  { id: 'pg-page', Component: PGPageView },
  { id: 'ad-gallery', Component: AdGallerySection },
]
