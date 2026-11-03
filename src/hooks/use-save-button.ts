import { Stack } from "expo-router";
import type { ComponentProps } from "react";
import { Platform } from "react-native";

import { useSymbol } from "@/hooks/use-symbol";

type ToolbarButtonProps = ComponentProps<typeof Stack.Toolbar.Button>;

// Props for the "Sichern" header button: a done button on iOS, a check icon on Android, where
// toolbars only render icon buttons. Spread them onto a <Stack.Toolbar.Button> placed directly
// inside <Stack.Toolbar>: iOS ignores buttons wrapped in another component.
// Returns null on Android until the Material Symbol has loaded.
export function useSaveButton(): ToolbarButtonProps | null {
  const androidIcon = useSymbol("checkmark", "check");

  if (Platform.OS === "ios") {
    return { variant: "done", children: "Sichern" };
  }
  return androidIcon ? { icon: androidIcon, accessibilityLabel: "Sichern" } : null;
}
