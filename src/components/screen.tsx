import { router, Stack } from "expo-router";
import type { ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddButton } from "@/components/add-button";
import { AddEntryZoomButton } from "@/components/add-entry-zoom-button";
import { useSymbol } from "@/hooks/use-symbol";

type ScreenProps = {
  title: string;
  // The button for a new entry: "+" in the navigation bar (iOS), the floating button (Android)
  showAddButton?: boolean;
  // More buttons in the navigation bar, left of the "+" (iOS) or the gear (Android). Pass
  // <Stack.Toolbar.*> elements themselves: iOS ignores toolbar items wrapped in another component.
  toolbarItems?: ReactNode;
  children: ReactNode;
};

// A tab screen with a large title and the gear to the settings, in exactly the same place in every
// tab. iOS: the gear at the top left and the "+" for a new entry at the top right, as in Music, so
// the new entry grows out of a button of its own (one glass capsule would zoom open as a whole). A
// bottom toolbar would be hidden behind the tab bar, which UIKit draws above the toolbar of a tab's
// navigation stack. Android: the gear at the right, as Material places actions, and the floating
// button. The tab bar only switches between the tabs; it carries no actions (Apple HIG, tab bars).
export function Screen({ title, showAddButton, toolbarItems, children }: ScreenProps) {
  const settingsIcon = useSymbol("gearshape", "settings");
  // On Android the icon loads asynchronously; render the button once it is ready. An element, not a
  // component: iOS ignores toolbar items wrapped in another component.
  const settingsButton = settingsIcon && (
    <Stack.Toolbar.Button
      icon={settingsIcon}
      accessibilityLabel="Einstellungen"
      onPress={() => router.push("/settings")}
    />
  );

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
      {Platform.OS === "ios" && <Stack.Toolbar placement="left">{settingsButton}</Stack.Toolbar>}
      {/* Laid out in this order from left to right */}
      <Stack.Toolbar placement="right">
        {toolbarItems}
        {showAddButton && Platform.OS === "ios" && (
          <Stack.Toolbar.View>
            <AddEntryZoomButton />
          </Stack.Toolbar.View>
        )}
        {Platform.OS === "android" && settingsButton}
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
