import type { AndroidSymbol, SFSymbol } from "expo-symbols";
import { unstable_getMaterialSymbolSourceAsync } from "expo-symbols";
import { useEffect, useState } from "react";
import { type ImageSourcePropType, Platform } from "react-native";

// Material Symbols loaded so far, so screens opened again show their buttons right away.
const androidIcons = new Map<AndroidSymbol, ImageSourcePropType>();

// SF Symbol on iOS; Android needs the Material Symbol as an image (black, tinted where it is shown).
export function useSymbol(
  sf: SFSymbol,
  md: AndroidSymbol
): SFSymbol | ImageSourcePropType | undefined {
  const [androidIcon, setAndroidIcon] = useState(() => androidIcons.get(md));

  useEffect(() => {
    if (Platform.OS !== "android" || androidIcons.has(md)) return;
    unstable_getMaterialSymbolSourceAsync(md, 24, "black").then((source) => {
      if (!source) return;
      androidIcons.set(md, source);
      setAndroidIcon(source);
    });
  }, [md]);

  return Platform.OS === "ios" ? sf : androidIcon;
}
