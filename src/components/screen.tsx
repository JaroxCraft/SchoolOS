import { router, Stack } from "expo-router";
import type { ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddButton } from "@/components/add-button";
import { useSymbol } from "@/hooks/use-symbol";
import { NEW_ENTRY } from "@/lib/routes";

type ScreenProps = {
  title: string;
  // The button for a new entry: "+" in the bottom toolbar (iOS), the floating button (Android)
  showAddButton?: boolean;
  // More buttons in the navigation bar, left of the gear. Pass <Stack.Toolbar.*> elements
  // themselves: iOS ignores toolbar items wrapped in another component.
  toolbarItems?: ReactNode;
  children: ReactNode;
};

// A tab screen with a large title and the gear to the settings in the navigation bar, in exactly
// the same place in every tab. The "+" for a new entry sits at the bottom, in reach of the thumb:
// on iOS in the toolbar above the tab bar, as the compose button of Mail and Notes; on Android as
// the floating button. The tab bar only switches between the tabs; it carries no actions (Apple
// HIG, tab bars).
export function Screen({ title, showAddButton, toolbarItems, children }: ScreenProps) {
  const settingsIcon = useSymbol("gearshape", "settings");

  return (
    <>
      {children}
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
        {toolbarItems}
        {/* On Android the icon loads asynchronously; render the button once it is ready */}
        {settingsIcon && (
          <Stack.Toolbar.Button
            icon={settingsIcon}
            accessibilityLabel="Einstellungen"
            onPress={() => router.push("/settings")}
          />
        )}
      </Stack.Toolbar>
      {showAddButton && Platform.OS === "ios" && (
        <Stack.Toolbar placement="bottom">
          <Stack.Toolbar.Spacer />
          <Stack.Toolbar.Button
            icon="plus"
            accessibilityLabel="Neuer Eintrag"
            onPress={() => router.push(NEW_ENTRY)}
          />
        </Stack.Toolbar>
      )}
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
