import { useColorScheme } from "react-native";

export type Ink = {
  label: string;
  secondary: string;
  // Row accessories such as the disclosure chevron
  tertiary: string;
  danger: string;
};

// iOS: text colors for @expo/ui, whose Text only accepts plain color strings. The values are the
// iOS label, secondary label, tertiary label (on the grouped background) and red system colors.
export function useInk(): Ink {
  const dark = useColorScheme() === "dark";
  return {
    label: dark ? "#FFFFFF" : "#000000",
    secondary: dark ? "#98989F" : "#6C6C70",
    tertiary: dark ? "#5A5A5F" : "#BCBCC0",
    danger: dark ? "#FF453A" : "#FF3B30",
  };
}
