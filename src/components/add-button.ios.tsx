import { Color } from "expo-router";
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import { SymbolView } from "expo-symbols";
import { Pressable, View } from "react-native";

import type { AddButtonProps } from "@/components/add-button";

const SIZE = 56;
const canUseGlass = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

// iOS: a round tinted liquid glass button, or a plain blue circle before iOS 26.
export function AddButton({ onPress }: AddButtonProps) {
  const button = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Hinzufügen"
      onPress={onPress}
      style={{ width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" }}>
      <SymbolView name="plus" size={24} weight="semibold" tintColor="white" />
    </Pressable>
  );

  if (canUseGlass) {
    return (
      <GlassView isInteractive tintColor={Color.ios.systemBlue} style={{ borderRadius: SIZE / 2 }}>
        {button}
      </GlassView>
    );
  }
  return (
    <View
      style={{
        borderRadius: SIZE / 2,
        backgroundColor: Color.ios.systemBlue,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
      }}>
      {button}
    </View>
  );
}
