import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { useEffect } from "react";
import { Platform, useColorScheme } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { ensureSettings } from "@/db/actions";
import { useDatabaseMigrations } from "@/db/migrate";
import { seedDevData } from "@/db/seed";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { success, error } = useDatabaseMigrations();

  useEffect(() => {
    if (!success) return;
    ensureSettings();
    // Test timetable while developing; builds for testers start empty
    if (__DEV__) seedDevData();
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
        {/* iOS pushes the entry so it can zoom out of the add button */}
        <Stack.Screen
          name="entry/[id]"
          options={{ presentation: Platform.OS === "ios" ? "card" : "modal" }}
        />
      </Stack>
    </ThemeProvider>
  );
}
