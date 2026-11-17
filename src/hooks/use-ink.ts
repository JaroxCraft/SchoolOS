import { useColorScheme } from "react-native";

import { SYSTEM_COLORS } from "@/lib/system-colors";

export type Ink = {
  label: string;
  secondary: string;
  tertiary: string;
  danger: string;
  accent: string;
};

// Text colors for @expo/ui, whose Text only accepts plain color strings, so the native semantic
// colors of constants/colors.ts (used by React Native views) cannot be used here. The values are
// the iOS label, secondary label, tertiary label (on the grouped background), red and blue system
// colors, in light and dark mode; the light red and blue match SYSTEM_COLORS.
export function useInk(): Ink {
  const dark = useColorScheme() === "dark";
  return {
    label: dark ? "#FFFFFF" : "#000000",
    secondary: dark ? "#98989F" : "#6C6C70",
    tertiary: dark ? "#5A5A5F" : "#BCBCC0",
    danger: dark ? "#FF453A" : SYSTEM_COLORS.red,
    accent: dark ? "#0A84FF" : SYSTEM_COLORS.blue,
  };
}
