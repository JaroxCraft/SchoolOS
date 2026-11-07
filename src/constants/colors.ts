import { Color } from "expo-router";
import { Platform } from "react-native";

// Native semantic colors. Android only resolves them again when the component re-renders, so
// components using them must call useColorScheme() to update when light/dark mode changes.
export const colors = {
  label: Platform.select({ ios: Color.ios.label, default: Color.android.dynamic.onSurface }),
  secondaryLabel: Platform.select({
    ios: Color.ios.secondaryLabel,
    default: Color.android.dynamic.onSurfaceVariant,
  }),
  tint: Platform.select({ ios: Color.ios.systemBlue, default: Color.android.dynamic.primary }),
  separator: Platform.select({
    ios: Color.ios.separator,
    default: Color.android.dynamic.outlineVariant,
  }),
  // The current time in the timetable, like the red line in Calendar
  now: Platform.select({ ios: Color.ios.systemRed, default: Color.android.dynamic.error }),
  // Today's column in the week view
  highlight: Platform.select({
    ios: Color.ios.secondarySystemFill,
    default: Color.android.dynamic.surfaceContainerHigh,
  }),
};
