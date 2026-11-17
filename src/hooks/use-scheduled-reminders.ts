import { useEffect, useState } from "react";

import { getScheduledReminders, type ScheduledReminder } from "@/lib/notifications";

// The reminders the system has scheduled, for the development tools. Read when the screen opens
// and on `refresh`, since the plan is applied in the background after every change.
export function useScheduledReminders() {
  const [scheduled, setScheduled] = useState<ScheduledReminder[]>([]);

  useEffect(() => {
    if (__DEV__) getScheduledReminders().then(setScheduled);
  }, []);

  const refresh = () => getScheduledReminders().then(setScheduled);
  return { scheduled, refresh };
}
