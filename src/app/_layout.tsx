import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { useEffect } from "react";
import { useColorScheme } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { ensureSettings } from "@/db/actions";
import { useDatabaseMigrations } from "@/db/migrate";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { success, error } = useDatabaseMigrations();

  useEffect(() => {
    if (success) ensureSettings();
  }, [success]);

  if (error) {
    return <EmptyState title="Datenbank konnte nicht geladen werden" message={error.message} />;
  }
  if (!success) return null;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="entry/[id]" options={{ presentation: "modal" }} />
      </Stack>
    </ThemeProvider>
  );
}
