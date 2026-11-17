import { useEffect, useState } from "react";

import { getScheduledReminders, type ScheduledReminder } from "@/lib/notification-dev-tools";

export function useScheduledReminders() {
  const [scheduled, setScheduled] = useState<ScheduledReminder[]>([]);

  useEffect(() => {
    if (__DEV__) getScheduledReminders().then(setScheduled);
  }, []);

  const refresh = () => getScheduledReminders().then(setScheduled);
  return { scheduled, refresh };
}
