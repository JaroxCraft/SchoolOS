import { Alert } from "react-native";

import type { ConfirmOptions } from "@/lib/confirm-dialog-store";

// iOS: asks with the native alert before an action that changes or deletes data.
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
  Alert.alert(title, message, [
    { text: "Abbrechen", style: "cancel" },
    { text: confirmLabel, style: destructive ? "destructive" : "default", onPress: onConfirm },
  ]);
}

// A message with a single "OK" button, e.g. why an import failed.
export function showMessage(title: string, message: string) {
  confirm({ title, message, confirmLabel: "OK", onConfirm: () => {}, messageOnly: true });
}
