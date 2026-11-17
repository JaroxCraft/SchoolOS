import { Stack } from "expo-router";
import type { ReactNode } from "react";
import { Platform } from "react-native";

import { releaseOpening } from "@/lib/routes";

// The stack of every navigator. Android drops the shadow under the header, as the Material 3 top
// app bar has none at rest; screen options do not carry over to nested stacks. The end of every
// transition, a push or a sheet coming in or going away, lifts the lock of claimOpening.
export function AppStack({ children }: { children?: ReactNode }) {
  return (
    <Stack
      screenOptions={{ headerShadowVisible: Platform.OS !== "android" }}
      screenListeners={{ transitionEnd: releaseOpening }}>
      {children}
    </Stack>
  );
}
