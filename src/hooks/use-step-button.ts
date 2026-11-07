import { Stack } from "expo-router";
import type { ComponentProps } from "react";
import { Platform } from "react-native";

import { useSymbol } from "@/hooks/use-symbol";

type ToolbarButtonProps = ComponentProps<typeof Stack.Toolbar.Button>;

// Props for the header button of a setup step: "Weiter" to the next step, "Fertig" on the last
// one. Android toolbars only render icon buttons, so it shows an arrow or a check there. Spread
// them onto a <Stack.Toolbar.Button> placed directly inside <Stack.Toolbar>, like useSaveButton.
// Returns null on Android until the Material Symbol has loaded.
export function useStepButton(step: "next" | "done"): ToolbarButtonProps | null {
  const next = step === "next";
  const androidIcon = useSymbol(
    next ? "arrow.right" : "checkmark",
    next ? "arrow_forward" : "check"
  );

  if (Platform.OS === "ios") {
    return next ? { children: "Weiter" } : { variant: "done", children: "Fertig" };
  }
  return androidIcon ? { icon: androidIcon, accessibilityLabel: next ? "Weiter" : "Fertig" } : null;
}
