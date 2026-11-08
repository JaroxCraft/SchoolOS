import { usePreventRemove } from "expo-router";
import { useState } from "react";

import { confirm } from "@/lib/confirm";

// Asks before a form with unsaved changes is left by back, swipe or "Abbrechen", instead of
// throwing the input away silently (Apple HIG, sheets: confirm before closing with unsaved
// changes). Returns `allowLeave`: call it right before the form closes itself after saving or
// deleting. A pushed form also wraps its content in <DiscardGuard>, since the iOS back button and
// swipe would leave before the question.
export function useDiscardGuard(dirty: boolean) {
  // Turns the prevention off in the same update that disables it, so the prop never stays true
  // after repeat/disablePrevention (usePreventRemove warns about that in development)
  const [leaving, setLeaving] = useState(false);
  const disablePrevention = usePreventRemove(dirty && !leaving, ({ repeat }) =>
    confirm({
      title: "Änderungen verwerfen?",
      message: "Deine Eingaben sind noch nicht gesichert.",
      confirmLabel: "Änderungen verwerfen",
      onConfirm: () => {
        setLeaving(true);
        repeat();
      },
    })
  );
  return () => {
    setLeaving(true);
    disablePrevention();
  };
}
