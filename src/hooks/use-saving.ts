import { useRef, useState } from "react";

// Runs a save at most once at a time: a second tap on ✓ while the first save still runs is ignored,
// so nothing is inserted twice. `saving` is for disabling the button meanwhile; the ref guards
// already before that state has re-rendered the button. A form that closes after saving
// (closesOnSuccess) stays locked afterwards, since its ✓ can still be tapped while it slides away.
export function useSaving({ closesOnSuccess = false } = {}) {
  const [saving, setSaving] = useState(false);
  const running = useRef(false);

  const run = async (action: () => Promise<void>) => {
    if (running.current) return;
    running.current = true;
    setSaving(true);
    let succeeded = false;
    try {
      await action();
      succeeded = true;
    } finally {
      if (!(succeeded && closesOnSuccess)) {
        running.current = false;
        setSaving(false);
      }
    }
  };

  return { saving, run };
}
