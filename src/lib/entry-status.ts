import type { Entry, EntryType } from "@/db/schema";

export type EntryLists = {
  open: Entry[];
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
