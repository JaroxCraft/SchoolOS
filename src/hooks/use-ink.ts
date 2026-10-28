import { useColorScheme } from "react-native";

// Text colors for @expo/ui, whose Text only accepts plain color strings.
export function useInk() {
  const dark = useColorScheme() === "dark";
  return {
    label: dark ? "#FFFFFF" : "#000000",
    secondary: dark ? "#98989F" : "#6C6C70",
    danger: dark ? "#FF453A" : "#FF3B30",
  };
}
