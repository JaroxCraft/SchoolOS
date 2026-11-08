import { usePreventRemove } from "expo-router";

import { confirm } from "@/lib/confirm";

// Asks before a form with unsaved changes is left by back, swipe or "Abbrechen", instead of
// throwing the input away silently (Apple HIG, sheets: confirm before closing with unsaved
// changes). Returns `allowLeave`: call it right before the form closes itself after saving or
// deleting. A pushed form also wraps its content in <DiscardGuard>, since the iOS back button and
// swipe would leave before the question.
export function useDiscardGuard(dirty: boolean) {
  return usePreventRemove(dirty, ({ repeat }) =>
    confirm({
      title: "Änderungen verwerfen?",
      message: "Deine Eingaben sind noch nicht gesichert.",
      confirmLabel: "Änderungen verwerfen",
      onConfirm: repeat,
    })
  );
}
