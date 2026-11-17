import { useColorScheme } from "react-native";

export type Ink = {
  label: string;
  secondary: string;
  // Row accessories such as the disclosure chevron
  tertiary: string;
  danger: string;
  // Selection marks such as the checkmark of the chosen subject
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
    danger: dark ? "#FF453A" : "#FF3B30",
    accent: dark ? "#0A84FF" : "#007AFF",
  };
}
