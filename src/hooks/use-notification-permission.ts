import { useCallback, useEffect, useState } from "react";

import { useOnAppActive } from "@/hooks/use-on-app-active";
import { getNotificationPermission, type NotificationPermission } from "@/lib/notifications";

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
