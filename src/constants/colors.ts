import { Color } from "expo-router";
import { Platform, useColorScheme } from "react-native";

// Native semantic colors, for React Native views (the empty state, the timetable). They follow the
// system appearance and Material You by themselves, but only React Native components accept them:
// the Text of @expo/ui takes plain color strings, so the @expo/ui screens use the hex values of
// useInk instead. Android only resolves them again when the component re-renders, so components
// using them must call useNativeColorsRefresh() to update when light/dark mode changes.
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

// Re-renders the component on light/dark changes, so Android resolves the native colors again
export function useNativeColorsRefresh() {
  useColorScheme();
}
