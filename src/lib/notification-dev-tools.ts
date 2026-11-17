import * as Notifications from "expo-notifications";

import { CHANNEL_ID, ensureChannel } from "@/lib/notifications";

export type ScheduledReminder = {
  id: string;
  title: string;
  body: string;
  at: Date | null;
  data: Record<string, unknown>;
};

// What the system has scheduled right now, the next one first
export async function getScheduledReminders(): Promise<ScheduledReminder[]> {
  const requests = await Notifications.getAllScheduledNotificationsAsync();
  return requests
    .map(({ identifier, content }) => ({
      id: identifier,
      title: content.title ?? "",
      body: content.body ?? "",
      at: typeof content.data?.at === "number" ? new Date(content.data.at) : null,
      data: content.data ?? {},
    }))
    .sort((a, b) => (a.at?.getTime() ?? Infinity) - (b.at?.getTime() ?? Infinity));
}

// Sends a copy of the reminder in 10 seconds, or a sample without one, so content and tap can be
// checked without waiting for the planned time. Tapping the sample opens the agenda. The copy is
// lost if the reminders are planned again before it arrives (any change of the data).
export async function sendTestReminder(reminder: ScheduledReminder | undefined) {
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: reminder?.title ?? "Testmitteilung",
      body: reminder?.body ?? "Gerade ist keine Erinnerung geplant.",
      sound: "default",
      data: { entryId: null, ...reminder?.data },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 10,
      channelId: CHANNEL_ID,
    },
  });
}
