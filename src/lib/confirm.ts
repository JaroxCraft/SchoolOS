import * as Haptics from "expo-haptics";

import { confirm } from "@/lib/confirm-native";

export type ConfirmOptions = {
  title: string;
  message: string;
  // Label of the button that carries out the action, e.g. "Löschen"
  confirmLabel: string;
  onConfirm: () => void;
  // An action the user started that deletes or discards data: an action sheet on iOS instead of
  // an alert (default true); Android shows the same dialog either way
  destructive?: boolean;
  // A plain message with a single button, without "Abbrechen"
  messageOnly?: boolean;
};

// Confirmations and messages. `confirm` is per platform (confirm-native.ts: iOS action sheet or
// alert; confirm-native.android.ts: the Material 3 dialog), the message is built on it once.
export { confirm };

// A message with a single "OK" button, e.g. why an import failed.
export function showMessage(title: string, message: string) {
  confirm({ title, message, confirmLabel: "OK", onConfirm: () => {}, messageOnly: true });
}

// A message about something that failed, with the error haptic first
export function showError(title: string, message: string) {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  showMessage(title, message);
}
