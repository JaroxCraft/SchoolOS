import { useFocusEffect } from "expo-router";
import { useCallback, useSyncExternalStore } from "react";

import type { Entry } from "@/db/schema";

// Tasks checked or unchecked on the current screen, with the state they had before. They stay in
// the list and section they were in until the screen is left, so a tap never makes a row jump
// away and a mistaken tap can simply be undone.
let toggled: ReadonlyMap<number, boolean> = new Map();
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

// Whether a task counts as completed for placing it in a list: the state it had when the screen
// was opened. Cleared when the screen loses focus.
export function useWasCompleted(): (entry: Entry) => boolean {
  useFocusEffect(
    useCallback(
      () => () => {
        if (toggled.size > 0) set(new Map());
      },
      []
    )
  );
  const current = useSyncExternalStore(subscribe, () => toggled);
  return (entry) => current.get(entry.id) ?? entry.completed;
}
