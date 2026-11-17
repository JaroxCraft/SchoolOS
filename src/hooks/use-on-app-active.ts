import { useEffect } from "react";
import { AppState } from "react-native";

// Calls `callback` each time the app comes back to the foreground
export function useOnAppActive(callback: () => void) {
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") callback();
    });
    return () => subscription.remove();
  }, [callback]);
}
