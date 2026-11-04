import { PAGE_SECTIONS, type PageSection } from './sections'

/**
 * The single `<main>` landmark. Sections stack with a white gap between them
 * (body's surface showing through) and scroll as a normal document: no scroll
 * snapping or smooth-scroll library.
 */
export function PageStack({ sections = PAGE_SECTIONS }: { sections?: readonly PageSection[] }) {
  return (
    <main className="flex flex-col gap-section-gap pb-section-gap">
      {sections.map(({ id, Component }) => (
        <Component key={id} />
      ))}
    </main>
  )
}
