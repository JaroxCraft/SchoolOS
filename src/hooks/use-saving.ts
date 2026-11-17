import { useRef, useState } from "react";

// The ref blocks a second tap on ✓ even before `saving` has re-rendered the button.
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
