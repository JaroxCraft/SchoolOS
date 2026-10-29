import { Stack } from "expo-router";
import type { ReactNode } from "react";
import { Platform } from "react-native";

// The stack of every navigator. Android drops the shadow under the header, as the Material 3 top
// app bar has none at rest; screen options do not carry over to nested stacks.
export function AppStack({ children }: { children?: ReactNode }) {
  return (
    <Stack screenOptions={{ headerShadowVisible: Platform.OS !== "android" }}>{children}</Stack>
  );
}
