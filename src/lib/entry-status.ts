import type { Entry, EntryType } from "@/db/schema";

// An entry is open until it is checked off, whatever its type; its date only decides whether it
// is overdue. An entry that was just checked off or reopened stays where it was for a moment
// before it moves: `placedBefore` holds the earlier state of those entries (see
// useEntryPlacement).

export type EntryLists = {
  // By date, overdue ones first
  open: Entry[];
  // Most recent first
  done: Entry[];
};

export function placeEntries(
  entries: Entry[],
  placedBefore: ReadonlyMap<number, boolean> = new Map()
): EntryLists {
  const open: Entry[] = [];
  const done: Entry[] = [];
  for (const entry of entries) {
    const isDone = placedBefore.get(entry.id) ?? entry.completed;
    if (isDone) done.push(entry);
    else open.push(entry);
  }
  return { open, done: done.reverse() };
}

export function isOverdue(entry: Entry, today: string): boolean {
  return !entry.completed && entry.date < today;
}

// The types that could not be checked off before every entry could (database migration 0005,
// format 1 of the export file). They dropped out once their date had passed, so past ones of them
// count as done; otherwise they would all show up as missed.
const EVENT_TYPES_BEFORE_CHECK_OFF: readonly EntryType[] = ["exam", "presentation", "other"];

export function completePastEvents<T extends Pick<Entry, "type" | "date" | "completed">>(
  entries: T[],
  today: string
): T[] {
  return entries.map((entry) =>
    EVENT_TYPES_BEFORE_CHECK_OFF.includes(entry.type) && entry.date < today
      ? { ...entry, completed: true }
      : entry
  );
}
