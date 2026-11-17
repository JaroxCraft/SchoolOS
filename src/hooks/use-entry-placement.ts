import { useSyncExternalStore } from "react";

import { setEntryCompleted } from "@/db/actions";
import type { Entry } from "@/db/schema";
import { type EntryLists, placeEntries } from "@/lib/entry-status";

// Long enough to see the check land, as in Reminders; short enough not to read as stuck.
const HOLD_MS = 800;

let placedBefore: ReadonlyMap<number, boolean> = new Map();
const releases = new Map<number, ReturnType<typeof setTimeout>>();
const listeners = new Set<() => void>();

function set(next: ReadonlyMap<number, boolean>) {
  placedBefore = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function release(id: number) {
  releases.delete(id);
  const next = new Map(placedBefore);
  next.delete(id);
  set(next);
}

export async function checkOffEntry(entry: Entry, completed: boolean) {
  if (!placedBefore.has(entry.id)) set(new Map(placedBefore).set(entry.id, entry.completed));
  clearTimeout(releases.get(entry.id));
  releases.set(
    entry.id,
    setTimeout(() => release(entry.id), HOLD_MS)
  );
  await setEntryCompleted(entry.id, completed);
}

export function useEntryPlacement(): (entries: Entry[]) => EntryLists {
  const current = useSyncExternalStore(subscribe, () => placedBefore);
  return (entries) => placeEntries(entries, current);
}
