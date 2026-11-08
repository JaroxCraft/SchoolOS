import { Stack, ThemeProvider } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

import { AppStack } from "@/components/app-stack";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { initDatabase } from "@/db/actions";
import { useDatabaseMigrations } from "@/db/migrate";
import { useNavigationTheme } from "@/hooks/use-navigation-theme";

// Opened by a link straight into a sheet (e.g. an entry), the tabs are still beneath it
export const unstable_settings = { anchor: "(tabs)" };

export default function RootLayout() {
  const theme = useNavigationTheme();
  const { success, error } = useDatabaseMigrations();

  useEffect(() => {
    if (!success) return;
    initDatabase();
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
      <AppStack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ presentation: "modal", headerShown: false }} />
        {/* iOS: the entry draws its own navigation bar (SheetForm), so the "+" can zoom into it */}
        <Stack.Screen
          name="entry/[id]"
          options={{ presentation: "modal", headerShown: Platform.OS !== "ios" }}
        />
      </AppStack>
      <ConfirmDialog />
    </ThemeProvider>
  );
}
