import { TextLink } from '../../ui'

// PLACEHOLDER(04): every link here waits on user stories.
const exportLinks = ['Export to Sheets', 'Export to Calendar', 'Export Additions to Calendar']
const pageLinks = ['New PG Page', 'Other PG Pages']

/** Export and page-navigation links in the header column. */
export function PageLinks() {
  return (
    <nav aria-label="Page actions" className="flex flex-col gap-8">
      {[exportLinks, pageLinks].map((group) => (
        <ul key={group[0]} className="flex flex-col">
          {group.map((label) => (
            <li key={label}>
              <TextLink placeholder>{label}</TextLink>
            </li>
          ))}
        </ul>
      ))}
    </nav>
  )
}
