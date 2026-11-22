import { DEFAULT_PAGE_NAME, PAGE_NAME_MAX_LENGTH, displayName } from '../../domain/pages'
import { usePageCollectionActions, usePageMeta } from '../../store/pgPageStore'
import { TextLink } from '../../ui'
import { SignOutLink } from '../auth'

/** The page-name text box, so "New PG Page" can focus it for naming. */
export const PAGE_NAME_INPUT_ID = 'pg-page-name'

/**
 * Two-line page title plus the version line. The first line is a text box for
 * the page's name (LP-2.1); the h1 still reads as the full title, e.g.
 * "Jake's First PG Page", so the section stays labelled by it.
 */
export function PageHeader({ titleId }: { titleId?: string }) {
  const { name, version } = usePageMeta()
  const { renamePage } = usePageCollectionActions()

  return (
    <header className="flex flex-col gap-6">
      <div className="flex flex-col">
        <label htmlFor={PAGE_NAME_INPUT_ID} className="sr-only">
          Page name
        </label>
        <input
          id={PAGE_NAME_INPUT_ID}
          type="text"
          value={name}
          onChange={(e) => renamePage(e.target.value)}
          placeholder={DEFAULT_PAGE_NAME}
          maxLength={PAGE_NAME_MAX_LENGTH}
          autoComplete="off"
          spellCheck={false}
          className="interactive w-full min-w-0 cursor-text border-b-2 border-transparent bg-transparent font-display text-title font-light hover:border-border-strong focus:border-border-strong"
        />
        <h1 id={titleId} className="font-display text-title font-bold whitespace-nowrap">
          <span className="sr-only">{displayName({ name })}</span> PG Page
        </h1>
      </div>
      <div className="flex flex-col pl-4 text-meta">
        <span>Version {version}</span>
        {/* PLACEHOLDER(04): version history */}
        <TextLink size="meta" placeholder className="pl-1">
          visit other versions
        </TextLink>
        <SignOutLink />
      </div>
    </header>
  )
}
