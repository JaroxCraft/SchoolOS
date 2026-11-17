import { usePreventRemove } from "expo-router";
import { useState } from "react";

import { confirm } from "@/lib/confirm";

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
