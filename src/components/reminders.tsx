import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";

import { useEntries, useLessons, usePeriods, useSettings, useSubjects } from "@/db/queries";
import { useNow } from "@/hooks/use-now";
import { scheduleReminders } from "@/lib/notifications";
import { planReminders } from "@/lib/reminders";
import { openEntry } from "@/lib/routes";

function openReminder(response: Notifications.NotificationResponse) {
  Notifications.clearLastNotificationResponse();
  if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
  const entryId = response.notification.request.content.data?.entryId;
  if (typeof entryId === "number") {
    openEntry({ id: entryId });
  } else {
    router.navigate("/agenda");
  }
}

// Keeps the scheduled reminders in step with the data and opens what a tapped reminder is about.
// Its own component, so the clock it needs for a new day does not render the root layout again.
export function Reminders() {
  const entries = useEntries();
  const lessons = useLessons();
  const periods = usePeriods();
  const subjects = useSubjects();
  const settings = useSettings();
  // A new day plans one more day ahead
  const { date } = useNow();

  useEffect(() => {
    scheduleReminders(
      planReminders({ entries, lessons, periods, subjects, settings, now: new Date() })
    );
  }, [entries, lessons, periods, subjects, settings, date]);

  useEffect(() => {
    // The tap that launched the app
    const launched = Notifications.getLastNotificationResponse();
    if (launched) openReminder(launched);
    const subscription = Notifications.addNotificationResponseReceivedListener(openReminder);
    return () => subscription.remove();
  }, []);

  return null;
}
