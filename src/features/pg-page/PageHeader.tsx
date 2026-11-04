import { formatTitleLead } from '../../domain/pageTitle'
import { usePageMeta } from '../../store/pgPageStore'
import { TextLink } from '../../ui'

/** Two-line page title plus the version line. */
export function PageHeader() {
  const { ownerName, version } = usePageMeta()

  return (
    <header className="flex flex-col gap-6">
      <h1 className="font-display text-title whitespace-nowrap">
        <span className="block font-light">{formatTitleLead(ownerName)}</span>{' '}
        <span className="block font-bold">PG Page</span>
      </h1>
      <div className="flex flex-col pl-4 text-meta">
        <span>Version {version}</span>
        {/* PLACEHOLDER(04): version history */}
        <TextLink size="meta" placeholder className="pl-1">
          visit other versions
        </TextLink>
      </div>
    </header>
  )
}
