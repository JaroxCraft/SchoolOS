import type { AndroidSymbol } from "expo-symbols";
import { Stack } from "expo-router";
import { Platform } from "react-native";

import { useToolbarIcon } from "@/hooks/use-toolbar-icon";

type HeaderButtonProps = {
  label: string;
  // Android toolbars only show icons, so the label becomes this Material Symbol there
  icon: AndroidSymbol;
  onPress: () => void;
  disabled?: boolean;
};

// A text button in the header (iOS) or an icon button (Android).
// Render inside <Stack.Toolbar>.
export function HeaderButton({ label, icon, onPress, disabled }: HeaderButtonProps) {
  const androidIcon = useToolbarIcon("checkmark", icon);

  if (Platform.OS === "ios") {
    return (
      <Stack.Toolbar.Button variant="done" disabled={disabled} onPress={onPress}>
        {label}
      </Stack.Toolbar.Button>
    );
  }
  // The Material Symbol loads asynchronously
  if (!androidIcon) return null;
  return (
    <Stack.Toolbar.Button
      icon={androidIcon}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
    />
  );
}
