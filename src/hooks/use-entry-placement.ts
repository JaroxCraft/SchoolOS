import { useFocusEffect, useNavigationContainerRef } from "expo-router";
import { useCallback, useSyncExternalStore } from "react";

import { setEntryCompleted } from "@/db/actions";
import type { Entry } from "@/db/schema";
import { type EntryLists, placeEntries } from "@/lib/entry-status";

// Entries checked off or reopened on the current screen, with the state they had before. They stay
// in the list and section they were in until the screen is left, so a tap never makes a row jump
// away and a mistaken tap can simply be undone.
let placedBefore: ReadonlyMap<number, boolean> = new Map();
const listeners = new Set<() => void>();

function set(next: ReadonlyMap<number, boolean>) {
  placedBefore = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Checks an entry off or reopens it, from a row or the entry form. It keeps its place in the list
// below until that screen is left.
export async function checkOffEntry(entry: Entry, completed: boolean) {
  if (!placedBefore.has(entry.id)) set(new Map(placedBefore).set(entry.id, entry.completed));
  await setEntryCompleted(entry.id, completed);
}

// Splits entries into open and done for a list (see placeEntries). The remembered places are
// cleared when the screen is left, but not when a sheet (an entry, the settings) merely covers it:
// the user comes back to the same list.
export function useEntryPlacement(): (entries: Entry[]) => EntryLists {
  const navigation = useNavigationContainerRef();
  useFocusEffect(
    useCallback(
      () => () => {
        // The blur runs after the navigation state changed, so the root state already shows the
        // sheet on top of the tabs; everything above the tabs in the root stack is a sheet
        const root = navigation.isReady() ? navigation.getRootState() : undefined;
        if (root && root.index > 0) return;
        if (placedBefore.size > 0) set(new Map());
      },
      [navigation]
    )
  );
  const current = useSyncExternalStore(subscribe, () => placedBefore);
  return (entries) => placeEntries(entries, current);
}
