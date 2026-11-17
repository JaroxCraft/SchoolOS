import { useCallback, useEffect, useState } from "react";

import { useOnAppActive } from "@/hooks/use-on-app-active";
import { getNotificationPermission, type NotificationPermission } from "@/lib/notifications";

// The notification permission, read again when the app comes back from the system settings.
// null until it is known.
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  const refresh = useCallback(() => {
    getNotificationPermission().then(setPermission);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useOnAppActive(refresh);

  return [permission, setPermission] as const;
}
