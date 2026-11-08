import { useEffect, useState } from "react";
import { AppState } from "react-native";

import { toISODate } from "@/lib/dates";

export type Now = { date: string; minutes: number };

// One clock reading for both, so date and minutes cannot disagree around midnight
const readNow = (): Now => {
  const now = new Date();
  return { date: toISODate(now), minutes: now.getHours() * 60 + now.getMinutes() };
};

// Today's date and the minutes since midnight, updated every half minute, for everything that
// depends on the time: the current lesson, overdue tasks, "heute"/"morgen". Screens must take the
// time from here instead of reading the clock while rendering, since native tabs keep them mounted
// for days and nothing else would render them again. Only re-renders when either actually changed.
export function useNow(): Now {
  const [now, setNow] = useState(readNow);

  useEffect(() => {
    const refresh = () => {
      const next = readNow();
      setNow((prev) => (prev.date === next.date && prev.minutes === next.minutes ? prev : next));
    };
    const interval = setInterval(refresh, 30_000);
    // Timers stand still in the background, so coming back the next morning would show yesterday
    // for up to half a minute
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  return now;
}
