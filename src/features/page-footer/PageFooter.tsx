import { formatTitleLead } from '../../domain/pageTitle'
import { usePageMeta } from '../../store/pgPageStore'
import { TextLink } from '../../ui'

/**
 * The deep-red band that ends the page (the `contentinfo` landmark, rendered
 * after `<main>`). "Customize" sits top right and the page name bottom right,
 * built from the same page meta as the header so the two never disagree.
 */
export function PageFooter() {
  const { ownerName } = usePageMeta()

  return (
    <footer className="bg-surface-footer text-text-on-footer [--color-focus-ring:var(--color-focus-ring-inverse)]">
      <div className="mx-auto flex h-footer max-w-page flex-col items-end justify-between px-16 py-12">
        {/* PLACEHOLDER(09): Customize (OQ-18: which boards show, and in what order). */}
        <TextLink placeholder className="font-display">
          Customize
        </TextLink>
        <p className="max-w-footer-name text-right font-display text-section font-bold">
          {/* "PG Page" stays together, so the narrow measure breaks after the lead. */}
          {formatTitleLead(ownerName)} PG{' '}Page
        </p>
      </div>
    </footer>
  )
}
