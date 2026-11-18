import { usePreventRemove } from "expo-router";
import { useState } from "react";

import { t } from "@/i18n";
import { confirm } from "@/lib/confirm";

export function useDiscardGuard(dirty: boolean) {
  // Turns the prevention off in the same update that disables it, so the prop never stays true
  // after repeat/disablePrevention (usePreventRemove warns about that in development)
  const [leaving, setLeaving] = useState(false);
  const disablePrevention = usePreventRemove(dirty && !leaving, ({ repeat }) =>
    confirm({
      title: t.common.discard.title,
      message: t.common.discard.message,
      confirmLabel: t.common.discard.confirm,
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
