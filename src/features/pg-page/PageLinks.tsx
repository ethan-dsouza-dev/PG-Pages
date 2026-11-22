import { flushSync } from 'react-dom'
import { usePageCollectionActions } from '../../store/pgPageStore'
import { TextLink } from '../../ui'
import { PAGE_NAME_INPUT_ID } from './PageHeader'
import { PageSwitcher } from './PageSwitcher'

// PLACEHOLDER(04): the export links wait on user stories.
const exportLinks = ['Export to Sheets', 'Export to Calendar', 'Export Additions to Calendar']

/** Export and page-navigation links in the header column. */
export function PageLinks() {
  const { createPage } = usePageCollectionActions()

  // LP-2.2: the new page starts as "Untitled"; focus its name so the user can type one.
  const onNewPage = () => {
    flushSync(createPage)
    const input = document.getElementById(PAGE_NAME_INPUT_ID)
    if (input instanceof HTMLInputElement) {
      input.focus()
      input.select()
    }
  }

  return (
    <nav aria-label="Page actions" className="flex flex-col gap-8">
      <ul className="flex flex-col">
        {exportLinks.map((label) => (
          <li key={label}>
            <TextLink placeholder>{label}</TextLink>
          </li>
        ))}
      </ul>
      <ul className="flex flex-col">
        <li>
          <TextLink onClick={onNewPage}>New PG Page</TextLink>
        </li>
        <li>
          <PageSwitcher />
        </li>
      </ul>
    </nav>
  )
}
