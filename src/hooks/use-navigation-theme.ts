import { DarkTheme, DefaultTheme, type Theme } from "expo-router";
import { useColorScheme } from "react-native";

export function useNavigationTheme(): Theme {
  return useColorScheme() === "dark" ? DarkTheme : DefaultTheme;
}
