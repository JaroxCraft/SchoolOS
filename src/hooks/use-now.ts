import { useEffect, useState } from "react";

import { today } from "@/lib/dates";

const readNow = () => {
  const now = new Date();
  return { date: today(), minutes: now.getHours() * 60 + now.getMinutes() };
};

// Today's date and the minutes since midnight, updated every half minute, for the current-time
// line and the current lesson in the timetable.
export function useNow() {
  const [now, setNow] = useState(readNow);

  useEffect(() => {
    const interval = setInterval(() => setNow(readNow()), 30_000);
    return () => clearInterval(interval);
  }, []);

  return now;
}
