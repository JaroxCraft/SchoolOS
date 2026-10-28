import type { AndroidSymbol, SFSymbol } from "expo-symbols";
import { unstable_getMaterialSymbolSourceAsync } from "expo-symbols";
import { useEffect, useState } from "react";
import { type ImageSourcePropType, Platform } from "react-native";

// The toolbar only takes SF Symbols on iOS, Android needs the Material Symbol as an image.
export function useToolbarIcon(
  sf: SFSymbol,
  md: AndroidSymbol
): SFSymbol | ImageSourcePropType | undefined {
  const [androidIcon, setAndroidIcon] = useState<ImageSourcePropType | null>(null);

  useEffect(() => {
    if (Platform.OS === "android") {
      unstable_getMaterialSymbolSourceAsync(md, 24, "black").then(setAndroidIcon);
    }
  }, [md]);

  return Platform.OS === "ios" ? sf : (androidIcon ?? undefined);
}
