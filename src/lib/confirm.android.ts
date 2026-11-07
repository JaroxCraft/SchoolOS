import { type ConfirmOptions, showConfirmDialog } from "@/lib/confirm-dialog-store";

// Android: asks with the Material 3 dialog of <ConfirmDialog> before an action that changes or
// deletes data. The alert of React Native still uses the old dialog style.
export function confirm(options: ConfirmOptions) {
  showConfirmDialog(options);
}

// A message with a single "OK" button, e.g. why an import failed.
export function showMessage(title: string, message: string) {
  confirm({ title, message, confirmLabel: "OK", onConfirm: () => {}, messageOnly: true });
}
