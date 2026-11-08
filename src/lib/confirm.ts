import { confirm } from "@/lib/confirm-native";

// Confirmations and messages. `confirm` is per platform (confirm-native.ts: iOS action sheet or
// alert; confirm-native.android.ts: the Material 3 dialog), the message is built on it once.
export { confirm };

// A message with a single "OK" button, e.g. why an import failed.
export function showMessage(title: string, message: string) {
  confirm({ title, message, confirmLabel: "OK", onConfirm: () => {}, messageOnly: true });
}
