import * as Notifications from "expo-notifications";
// Named: eslint-plugin-import does not find these enums on the namespace
import { AndroidImportance, IosAuthorizationStatus } from "expo-notifications";
import { Linking, Platform } from "react-native";

import type { Reminder } from "@/lib/reminders";

// Android 8+ shows notifications only in a channel; the user can turn it off on its own
const CHANNEL_ID = "reminders";

// "undetermined": never asked, the system dialog can still be shown
export type NotificationPermission = "granted" | "denied" | "undetermined";

// Reminders that arrive while the app is open are shown like any other
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Android 13+ only shows the permission dialog once a channel exists
async function ensureChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Erinnerungen",
    description: "Was bis zum nächsten Schultag fällig ist und wann das Lernen beginnt",
    importance: AndroidImportance.HIGH,
  });
}

function toPermission(status: Notifications.NotificationPermissionsStatus): NotificationPermission {
  if (status.granted || status.ios?.status === IosAuthorizationStatus.PROVISIONAL) {
    return "granted";
  }
  return status.status === Notifications.PermissionStatus.UNDETERMINED ? "undetermined" : "denied";
}

// Reminders need no badge
const PERMISSION_REQUEST = { ios: { allowAlert: true, allowSound: true, allowBadge: false } };

export async function getNotificationPermission(): Promise<NotificationPermission> {
  return toPermission(await Notifications.getPermissionsAsync());
}

// Asks for the permission while the system still shows its dialog (Android asks twice at most),
// otherwise opens the app's page in the system settings.
export async function allowNotifications(): Promise<NotificationPermission> {
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (toPermission(current) === "granted") return "granted";
  if (current.canAskAgain) {
    return toPermission(await Notifications.requestPermissionsAsync(PERMISSION_REQUEST));
  }
  await Linking.openSettings();
  return "denied";
}

// Replaces the scheduled reminders with the plan. Scheduled even without permission: allowed
// later in the system settings, they arrive without the app being opened again. The first plan
// with reminders asks for the permission, i.e. right after the first entry is saved, when it is
// clear what it is for; a user who said no is not asked again (see allowNotifications).
async function apply(reminders: Reminder[]) {
  if (reminders.length > 0) {
    await ensureChannel();
    const { status } = await Notifications.getPermissionsAsync();
    if (status === Notifications.PermissionStatus.UNDETERMINED) {
      await Notifications.requestPermissionsAsync(PERMISSION_REQUEST);
    }
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const reminder of reminders) {
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: {
        title: reminder.title,
        body: reminder.body,
        sound: "default",
        data: { entryId: reminder.entryId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.date,
        channelId: CHANNEL_ID,
      },
    });
  }
}

let latest: Reminder[] | null = null;
let applied = "";
let queue = Promise.resolve();

// Plans arrive in bursts (an import changes several tables one after the other). They are applied
// one at a time; a plan overtaken by a newer one is skipped, an unchanged one is not applied again.
export function scheduleReminders(reminders: Reminder[]) {
  latest = reminders;
  queue = queue.then(async () => {
    if (latest !== reminders) return;
    const key = JSON.stringify(reminders);
    if (key === applied) return;
    try {
      await apply(reminders);
      applied = key;
    } catch (error) {
      console.warn("Erinnerungen konnten nicht geplant werden", error);
    }
  });
}
