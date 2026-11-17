import { useSyncExternalStore } from "react";

import { setEntryCompleted } from "@/db/actions";
import type { Entry } from "@/db/schema";
import { type EntryLists, placeEntries } from "@/lib/entry-status";

// How long an entry that was just checked off or reopened stays where it was, already showing its
// new state, before it leaves the Übersicht or moves to the other section of the Agenda (animated,
// see FormList's rowsKey). Long enough to see the check land, as in Reminders; short enough not to
// read as stuck. A second tap in that time reopens it in place.
const HOLD_MS = 800;

// The entries still held, with the state they had before the toggle
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

// Checks an entry off or reopens it, from a row or the entry form. Each toggle holds the entry in
// its place for HOLD_MS again, so tapping twice never makes it jump in between.
export async function checkOffEntry(entry: Entry, completed: boolean) {
  if (!placedBefore.has(entry.id)) set(new Map(placedBefore).set(entry.id, entry.completed));
  clearTimeout(releases.get(entry.id));
  releases.set(
    entry.id,
    setTimeout(() => release(entry.id), HOLD_MS)
  );
  await setEntryCompleted(entry.id, completed);
}

// Splits entries into open and done for a list (see placeEntries), with the entries just toggled
// still where they were
export function useEntryPlacement(): (entries: Entry[]) => EntryLists {
  const current = useSyncExternalStore(subscribe, () => placedBefore);
  return (entries) => placeEntries(entries, current);
}
