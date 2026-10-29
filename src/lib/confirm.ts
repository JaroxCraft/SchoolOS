import { Alert } from "react-native";

import type { ConfirmOptions } from "@/lib/confirm-dialog-store";

// iOS: asks with the native alert before a destructive action.
export function confirm({ title, message, confirmLabel, onConfirm }: ConfirmOptions) {
  Alert.alert(title, message, [
    { text: "Abbrechen", style: "cancel" },
    { text: confirmLabel, style: "destructive", onPress: onConfirm },
  ]);
}
