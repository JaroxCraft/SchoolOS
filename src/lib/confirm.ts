import * as Haptics from "expo-haptics";

import { t } from "@/i18n";
import { confirm } from "@/lib/confirm-native";

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  // An action the user started that deletes or discards data: an action sheet on iOS instead of
  // an alert (default true); Android shows the same dialog either way
  destructive?: boolean;
  messageOnly?: boolean;
};

export { confirm };

export function showMessage(title: string, message: string) {
  confirm({ title, message, confirmLabel: t.common.ok, onConfirm: () => {}, messageOnly: true });
}

export function showError(title: string, message: string) {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  showMessage(title, message);
}
