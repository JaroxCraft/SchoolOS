import { useSyncExternalStore } from "react";
import { AppState, type NativeEventSubscription } from "react-native";

import { toISODate } from "@/lib/dates";
import type { Now } from "@/lib/schedule";

const readNow = (): Now => {
  const now = new Date();
  return { date: toISODate(now), minutes: now.getHours() * 60 + now.getMinutes() };
};

// One clock for all screens: a single timer and app-state listener, running while anything uses it
let now = readNow();
const listeners = new Set<() => void>();
let interval: ReturnType<typeof setInterval> | undefined;
let appState: NativeEventSubscription | undefined;

// Only notifies when either value actually changed, so screens keep the same object otherwise
function refresh() {
  const next = readNow();
  if (next.date === now.date && next.minutes === now.minutes) return;
  now = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    refresh();
    interval = setInterval(refresh, 30_000);
    // Timers stand still in the background, so coming back the next morning would show
    // yesterday for up to half a minute
    appState = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size > 0) return;
    clearInterval(interval);
    appState?.remove();
  };
}

const getNow = () => now;

// Today's date and the minutes since midnight, updated every half minute, for everything that
// depends on the time: the current lesson, overdue tasks, "heute"/"morgen". Screens must take the
// time from here instead of reading the clock while rendering, since native tabs keep them mounted
// for days and nothing else would render them again. Only re-renders when either actually changed.
export function useNow(): Now {
  return useSyncExternalStore(subscribe, getNow);
}
