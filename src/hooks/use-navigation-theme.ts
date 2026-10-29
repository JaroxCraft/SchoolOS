import { DarkTheme, DefaultTheme, type Theme } from "expo-router";
import { useColorScheme } from "react-native";

// iOS: the standard light and dark navigation themes, which match the SwiftUI lists.
export function useNavigationTheme(): Theme {
  return useColorScheme() === "dark" ? DarkTheme : DefaultTheme;
}
