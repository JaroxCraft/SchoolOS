import { Stack, ThemeProvider } from "expo-router";
import { useEffect } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { ensureSettings } from "@/db/actions";
import { useDatabaseMigrations } from "@/db/migrate";
import { seedDevData } from "@/db/seed";
import { useNavigationTheme } from "@/hooks/use-navigation-theme";

export default function RootLayout() {
  const theme = useNavigationTheme();
  const { success, error } = useDatabaseMigrations();

  useEffect(() => {
    if (!success) return;
    ensureSettings();
    // Test timetable while developing; builds for testers start empty
    if (__DEV__) seedDevData();
  }, [success]);

  if (error) {
    return (
      <EmptyState
        icon={{ ios: "exclamationmark.triangle", android: "warning" }}
        title="Datenbank konnte nicht geladen werden"
        message={error.message}
      />
    );
  }
  if (!success) return null;

  return (
    <ThemeProvider value={theme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="entry/[id]" options={{ presentation: "modal" }} />
      </Stack>
      <ConfirmDialog />
    </ThemeProvider>
  );
}
