import { router, Stack } from "expo-router";
import type { ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddButton } from "@/components/add-button";
import { useToolbarIcon } from "@/hooks/use-toolbar-icon";

type ScreenProps = {
  title: string;
  // Shows the floating "+" button for a new entry in the bottom right corner (Android)
  showAddButton?: boolean;
  children: ReactNode;
};

// A tab screen with a large title and the gear button to the settings.
export function Screen({ title, showAddButton, children }: ScreenProps) {
  const settingsIcon = useToolbarIcon("gearshape", "settings");

  return (
    <>
      {children}
      {/* iOS has the "+" next to the tab bar instead */}
      {showAddButton && Platform.OS === "android" && (
        // The safe area of this view includes the tab bar, so the button sits right above it
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <SafeAreaView edges={["bottom", "right"]} pointerEvents="box-none" style={styles.corner}>
            <AddButton />
          </SafeAreaView>
        </View>
      )}
      <Stack.Title large>{title}</Stack.Title>
      <Stack.Toolbar placement="right">
        {/* On Android the icon loads asynchronously; render the button once it is ready */}
        {settingsIcon && (
          <Stack.Toolbar.Button
            icon={settingsIcon}
            accessibilityLabel="Einstellungen"
            onPress={() => router.push("/settings")}
          />
        )}
      </Stack.Toolbar>
    </>
  );
}

const styles = StyleSheet.create({
  corner: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    padding: 16,
  },
});
