/** First line of the page title, e.g. "Jake's First" (the second line is "PG Page"). */
export function formatTitleLead(ownerName: string): string {
  const name = ownerName.trim()
  const possessive = /s$/i.test(name) ? `${name}'` : `${name}'s`
  return `${possessive} First`
}
