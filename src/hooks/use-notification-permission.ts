import { useEffect, useState } from "react";
import { AppState } from "react-native";

import { getNotificationPermission, type NotificationPermission } from "@/lib/notifications";

// The notification permission, read again when the app comes back from the system settings.
// null until it is known.
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    const refresh = () => getNotificationPermission().then(setPermission);
    refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => subscription.remove();
  }, []);

  return [permission, setPermission] as const;
}
