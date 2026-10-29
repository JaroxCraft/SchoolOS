import { useMaterialColors } from "@expo/ui/jetpack-compose";
import { DarkTheme, DefaultTheme, type Theme } from "expo-router";
import { useColorScheme } from "react-native";

// Android: screens and headers on the Material surface color, the same background the Compose
// lists draw, so screens with and without a list look alike.
export function useNavigationTheme(): Theme {
  const base = useColorScheme() === "dark" ? DarkTheme : DefaultTheme;
  const colors = useMaterialColors();
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.surface,
      card: colors.surface,
      text: colors.onSurface,
      border: colors.outlineVariant,
    },
  };
}
