import { type ConfirmOptions, showConfirmDialog } from "@/lib/confirm-dialog-store";

// Android: asks with the Material 3 dialog of <ConfirmDialog> before an action that changes or
// deletes data. The alert of React Native still uses the old dialog style.
export function confirm(options: ConfirmOptions) {
  showConfirmDialog(options);
}
