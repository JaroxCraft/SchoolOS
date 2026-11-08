import { ActionSheetIOS, Alert } from "react-native";

import type { ConfirmOptions } from "@/lib/confirm-dialog-store";

// iOS: asks before an action that changes or deletes data. A destructive choice the user started
// (delete, discard, reset) is an action sheet with the red button on top and "Abbrechen" below;
// anything else is an alert (Apple HIG, action sheets and alerts).
export function confirm({
  title,
  message,
  confirmLabel,
  onConfirm,
  destructive = true,
  messageOnly,
}: ConfirmOptions) {
  if (messageOnly) {
    Alert.alert(title, message, [{ text: confirmLabel, onPress: onConfirm }]);
    return;
  }
  if (destructive) {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        message,
        options: [confirmLabel, "Abbrechen"],
        destructiveButtonIndex: 0,
        cancelButtonIndex: 1,
      },
      (index) => {
        if (index === 0) onConfirm();
      }
    );
    return;
  }
  Alert.alert(title, message, [
    { text: "Abbrechen", style: "cancel" },
    { text: confirmLabel, onPress: onConfirm },
  ]);
}

// A message with a single "OK" button, e.g. why an import failed.
export function showMessage(title: string, message: string) {
  confirm({ title, message, confirmLabel: "OK", onConfirm: () => {}, messageOnly: true });
}
