import { router, Stack } from "expo-router";
import { unstable_getMaterialSymbolSourceAsync, type SFSymbol } from "expo-symbols";
import { useEffect, useState } from "react";
import { type ImageSourcePropType, Platform } from "react-native";

export function SettingsButton() {
  const icon = useSettingsIcon();

  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Button
        icon={icon}
        accessibilityLabel="Einstellungen"
        onPress={() => router.push("/settings")}
      />
    </Stack.Toolbar>
  );
}

// The toolbar only takes SF Symbols on iOS, Android needs the Material Symbol as an image.
function useSettingsIcon(): SFSymbol | ImageSourcePropType | undefined {
  const [androidIcon, setAndroidIcon] = useState<ImageSourcePropType | null>(null);

  useEffect(() => {
    if (Platform.OS === "android") {
      unstable_getMaterialSymbolSourceAsync("settings", 24, "black").then(setAndroidIcon);
    }
  }, []);

  return Platform.OS === "ios" ? "gearshape" : (androidIcon ?? undefined);
}
