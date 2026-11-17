// The item with this id, e.g. the subject of an entry. A null or undefined id finds nothing.
export function findById<T extends { id: number }>(
  items: T[],
  id: number | null | undefined
): T | undefined {
  return items.find((item) => item.id === id);
}
