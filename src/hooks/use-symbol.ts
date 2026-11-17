import type { AndroidSymbol, SFSymbol } from "expo-symbols";
import { unstable_getMaterialSymbolSourceAsync } from "expo-symbols";
import { useEffect, useState } from "react";
import { type ImageSourcePropType, Platform } from "react-native";

// Material Symbols loaded so far, so screens opened again show their buttons right away
const androidIcons = new Map<AndroidSymbol, ImageSourcePropType>();
// Loads in flight, so rows mounting together share one fetch per symbol
const loading = new Map<AndroidSymbol, Promise<ImageSourcePropType | null>>();

function loadSymbol(md: AndroidSymbol) {
  let promise = loading.get(md);
  if (!promise) {
    promise = unstable_getMaterialSymbolSourceAsync(md, 24, "black").then((source) => {
      if (source) androidIcons.set(md, source);
      else loading.delete(md);
      return source;
    });
    loading.set(md, promise);
  }
  return promise;
}

// SF Symbol on iOS; Android needs the Material Symbol as an image (black, tinted where it is shown).
export function useSymbol(
  sf: SFSymbol,
  md: AndroidSymbol
): SFSymbol | ImageSourcePropType | undefined {
  const [androidIcon, setAndroidIcon] = useState(() => androidIcons.get(md));

  useEffect(() => {
    if (Platform.OS !== "android" || androidIcons.has(md)) return;
    loadSymbol(md).then((source) => {
      if (source) setAndroidIcon(source);
    });
  }, [md]);

  return Platform.OS === "ios" ? sf : androidIcon;
}
