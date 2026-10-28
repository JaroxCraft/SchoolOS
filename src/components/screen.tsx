import { router, Stack } from "expo-router";
import type { ReactNode } from "react";

import { useToolbarIcon } from "@/hooks/use-toolbar-icon";

type ScreenProps = {
  title: string;
  // Shows a "+" button in the header
  onAdd?: () => void;
  children: ReactNode;
};

// A tab screen with a large title and the gear button to the settings.
export function Screen({ title, onAdd, children }: ScreenProps) {
  const addIcon = useToolbarIcon("plus", "add");
  const settingsIcon = useToolbarIcon("gearshape", "settings");

  return (
    <>
      {children}
      <Stack.Title large>{title}</Stack.Title>
      <Stack.Toolbar placement="right">
        {/* On Android the icons load asynchronously; render the buttons once they are ready */}
        {onAdd && addIcon && (
          <Stack.Toolbar.Button icon={addIcon} accessibilityLabel="Hinzufügen" onPress={onAdd} />
        )}
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
