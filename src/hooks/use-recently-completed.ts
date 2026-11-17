import { useFocusEffect, useNavigationContainerRef } from "expo-router";
import { useCallback, useSyncExternalStore } from "react";

import type { Entry } from "@/db/schema";

// Entries checked or unchecked on the current screen, with the state they had before. They stay in
// the list and section they were in until the screen is left, so a tap never makes a row jump
// away and a mistaken tap can simply be undone.
let toggled: ReadonlyMap<number, boolean> = new Map();
// Root stack routes presented as modals above the tabs (src/app/_layout.tsx)
const ROOT_MODALS = new Set(["settings", "entry/[id]"]);
const listeners = new Set<() => void>();

function set(next: ReadonlyMap<number, boolean>) {
  toggled = next;
  listeners.forEach((listener) => listener());
}

// Remembers the state before the first toggle on this screen.
export function markToggled(id: number, completedBefore: boolean) {
  if (toggled.has(id)) return;
  set(new Map(toggled).set(id, completedBefore));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Whether an entry counts as completed for placing it in a list: the state it had when the screen
// was opened. Cleared when the screen is left, but not when a root modal (an entry, the settings)
// merely covers it: the user comes back to the same list.
export function useWasCompleted(): (entry: Entry) => boolean {
  const navigation = useNavigationContainerRef();
  useFocusEffect(
    useCallback(
      () => () => {
        // The blur runs after the navigation state changed, so the root state already shows the
        // presented modal on top of the tabs
        const root = navigation.isReady() ? navigation.getRootState() : undefined;
        const top = root?.routes[root.index];
        if (top && ROOT_MODALS.has(top.name)) return;
        if (toggled.size > 0) set(new Map());
      },
      [navigation]
    )
  );
  const current = useSyncExternalStore(subscribe, () => toggled);
  return (entry) => current.get(entry.id) ?? entry.completed;
}
