import * as Notifications from "expo-notifications";
import { router, useNavigationContainerRef } from "expo-router";
import {
  type NavigationContainerRef,
  type ParamListBase,
  CommonActions,
} from "expo-router/react-navigation";
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
import { scheduleReminders } from "@/lib/notifications";
import { planReminders } from "@/lib/reminders";
import { openEntry } from "@/lib/routes";

function openReminder(
  response: Notifications.NotificationResponse,
  navigation: NavigationContainerRef<ParamListBase>
) {
  Notifications.clearLastNotificationResponse();
  if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
  const entryId = response.notification.request.content.data?.entryId;
  if (typeof entryId !== "number") {
    // With a sheet open (the settings, an entry), router.navigate would push the tabs once more,
    // presented as a sheet of their own on top. Instead the root stack goes back to the tabs
    // (pop) and switches to the agenda in the same action.
    const root = navigation.isReady() ? navigation.getRootState() : undefined;
    if (root && root.index > 0) {
      navigation.dispatch({
        ...CommonActions.navigate("(tabs)", { screen: "agenda" }, { pop: true }),
        target: root.key,
      });
    } else {
      router.navigate("/agenda");
    }
    return;
  }
  const entry = getEntries().find((candidate) => candidate.id === entryId);
  if (entry && !entry.completed) openEntry({ id: entryId });
}

export function Reminders() {
  const entries = useEntries();
  const lessons = useLessons();
  const periods = usePeriods();
  const subjects = useSubjects();
  const settings = useSettings();
  const { date } = useNow();

  useEffect(() => {
    scheduleReminders(
      planReminders({ entries, lessons, periods, subjects, settings, now: new Date() })
    );
  }, [entries, lessons, periods, subjects, settings, date]);

  const navigation = useNavigationContainerRef();
  useEffect(() => {
    const open = (response: Notifications.NotificationResponse) =>
      openReminder(response, navigation);
    const launched = Notifications.getLastNotificationResponse();
    if (launched) open(launched);
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, [navigation]);

  return null;
}
