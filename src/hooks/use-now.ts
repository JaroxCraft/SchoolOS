import { useCallback, useEffect, useState } from "react";

import { useOnAppActive } from "@/hooks/use-on-app-active";
import { toISODate } from "@/lib/dates";
import type { Now } from "@/lib/schedule";

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

  const refresh = useCallback(() => {
    const next = readNow();
    setNow((prev) => (prev.date === next.date && prev.minutes === next.minutes ? prev : next));
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Timers stand still in the background, so coming back the next morning would show yesterday
  // for up to half a minute
  useOnAppActive(refresh);

  return now;
}
