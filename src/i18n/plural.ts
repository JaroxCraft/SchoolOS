// "1 subject", "3 subjects": for the catalogs of languages with one singular and one plural form.
// A language with more forms picks them with Intl.PluralRules in its own catalog.
export function countOf(count: number, one: string, other: string): string {
  return `${count} ${count === 1 ? one : other}`;
}
