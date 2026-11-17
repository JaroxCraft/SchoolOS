import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";

import {
  getEntries,
  useEntries,
  useLessons,
  usePeriods,
  useSettings,
  useSubjects,
} from "@/db/queries";
import { useNow } from "@/hooks/use-now";
import { isCheckable } from "@/lib/entry-types";
import { scheduleReminders } from "@/lib/notifications";
import { planReminders } from "@/lib/reminders";
import { openEntry } from "@/lib/routes";

// A reminder about one entry opens it as a sheet, one about several switches to the agenda. If
// the entry is done or deleted by now, the tap only opens the app: a sheet with a checked-off task
// or "Eintrag nicht gefunden" would be in the way.
function openReminder(response: Notifications.NotificationResponse) {
  Notifications.clearLastNotificationResponse();
  if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
  const entryId = response.notification.request.content.data?.entryId;
  if (typeof entryId !== "number") {
    router.navigate("/agenda");
    return;
  }
  const entry = getEntries().find((candidate) => candidate.id === entryId);
  if (entry && !(isCheckable(entry.type) && entry.completed)) openEntry({ id: entryId });
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
