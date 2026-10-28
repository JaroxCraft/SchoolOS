import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import { Color, Link } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";

import { NEW_ENTRY } from "@/lib/routes";

const SIZE = 56;
const canUseGlass = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

// iOS: a round tinted liquid glass button (a blue circle before iOS 26). The new entry zooms
// out of the button and back into it when closed.
export function AddButton() {
  const icon = <SymbolView name="plus" size={24} weight="semibold" tintColor="white" />;

  return (
    <Link href={NEW_ENTRY} asChild>
      <Link.Trigger>
        <Pressable accessibilityRole="button" accessibilityLabel="Neuer Eintrag">
          <Link.AppleZoom>
            {canUseGlass ? (
              <GlassView tintColor={Color.ios.systemBlue} style={styles.circle}>
                {icon}
              </GlassView>
            ) : (
              <View style={[styles.circle, styles.fallback]}>{icon}</View>
            )}
          </Link.AppleZoom>
        </Pressable>
      </Link.Trigger>
    </Link>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  fallback: {
    backgroundColor: Color.ios.systemBlue,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
  },
});
