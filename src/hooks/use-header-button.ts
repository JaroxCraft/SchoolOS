import { Stack } from "expo-router";
import type { AndroidSymbol } from "expo-symbols";
import type { ComponentProps } from "react";
import { Platform } from "react-native";

import { useToolbarIcon } from "@/hooks/use-toolbar-icon";

type ToolbarButtonProps = ComponentProps<typeof Stack.Toolbar.Button>;

// Props for a header button that reads `label` on iOS and shows `icon` on Android, where
// toolbars only render icon buttons. Spread them onto a <Stack.Toolbar.Button> placed directly
// inside <Stack.Toolbar>: iOS ignores buttons wrapped in another component.
// Returns null on Android until the Material Symbol has loaded.
export function useHeaderButton(label: string, icon: AndroidSymbol): ToolbarButtonProps | null {
  const androidIcon = useToolbarIcon("checkmark", icon);

  if (Platform.OS === "ios") {
    return { variant: "done", children: label };
  }
  return androidIcon ? { icon: androidIcon, accessibilityLabel: label } : null;
}
