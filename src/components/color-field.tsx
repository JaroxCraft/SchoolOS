import { RNHostView } from "@expo/ui";
import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";

import { SUBJECT_COLORS } from "@/lib/subject-colors";

const SIZE = 34;
const PER_ROW = 5;

export type ColorFieldProps = {
  // "#RRGGBB"
  value: string;
  onChange: (color: string) => void;
  // Colors of other subjects (marked on Android, where the swatches are shown), with a small dot
  // so a free one is easy to find
  usedColors?: string[];
};

// Android: Material has no system color picker, so the subject colors are offered as round
// swatches to tap, like the color picker of Reminders; the selected one carries a checkmark. Two
// rows of five fit every phone width.
export function ColorField({ value, onChange, usedColors = [] }: ColorFieldProps) {
  const rows = [SUBJECT_COLORS.slice(0, PER_ROW), SUBJECT_COLORS.slice(PER_ROW)];

  return (
    <RNHostView matchContents>
      <View style={styles.grid} accessibilityRole="radiogroup">
        {rows.map((row, index) => (
          <View key={index} style={styles.row}>
            {row.map((option) => {
              const selected = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityLabel={option.name}
                  accessibilityState={{ selected }}
                  hitSlop={6}
                  onPress={() => {
                    if (selected) return;
                    Haptics.selectionAsync();
                    onChange(option.value);
                  }}
                  style={({ pressed }) => [
                    styles.swatch,
                    { backgroundColor: option.value },
                    pressed && styles.pressed,
                  ]}>
                  {selected ? (
                    <SymbolView
                      name={{ ios: "checkmark", android: "check" }}
                      size={16}
                      weight="bold"
                      tintColor="#FFFFFF"
                    />
                  ) : (
                    usedColors.includes(option.value) && <View style={styles.usedDot} />
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </RNHostView>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 12,
    paddingVertical: 6,
  },
  row: {
    flexDirection: "row",
    gap: 14,
  },
  swatch: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    transform: [{ scale: 0.92 }],
  },
  usedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
  },
});
