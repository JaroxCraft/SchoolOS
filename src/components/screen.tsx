import { router, Stack } from "expo-router";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddButton } from "@/components/add-button";
import { useToolbarIcon } from "@/hooks/use-toolbar-icon";

type ScreenProps = {
  title: string;
  // Shows a floating "+" button in the bottom right corner
  onAdd?: () => void;
  children: ReactNode;
};

// A tab screen with a large title and the gear button to the settings.
export function Screen({ title, onAdd, children }: ScreenProps) {
  const settingsIcon = useToolbarIcon("gearshape", "settings");

  return (
    <>
      {children}
      {onAdd && (
        // The safe area of this view includes the tab bar, so the button sits right above it
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <SafeAreaView edges={["bottom", "right"]} pointerEvents="box-none" style={styles.corner}>
            <AddButton onPress={onAdd} />
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
