import { ActionSheetIOS, Alert } from "react-native";

import { t } from "@/i18n";
import type { ConfirmOptions } from "@/lib/confirm";

// A destructive choice is an action sheet, anything else an alert (Apple HIG).
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
        options: [confirmLabel, t.common.cancel],
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
    { text: t.common.cancel, style: "cancel" },
    { text: confirmLabel, onPress: onConfirm },
  ]);
}
