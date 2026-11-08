import { useEffect, useState } from "react";

import { toISODate } from "@/lib/dates";

// One clock reading for both, so date and minutes cannot disagree around midnight
const readNow = () => {
  const now = new Date();
  return { date: toISODate(now), minutes: now.getHours() * 60 + now.getMinutes() };
};

// Today's date and the minutes since midnight, updated every half minute, for the current-time
// line and the current lesson in the timetable. Only re-renders when either actually changed.
export function useNow() {
  const [now, setNow] = useState(readNow);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = readNow();
      setNow((prev) => (prev.date === next.date && prev.minutes === next.minutes ? prev : next));
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  return now;
}
