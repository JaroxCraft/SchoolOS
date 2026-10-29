import { Color } from "expo-router";
import { Platform } from "react-native";

export const colors = {
  label: Platform.select({ ios: Color.ios.label, default: Color.android.dynamic.onSurface }),
  secondaryLabel: Platform.select({
    ios: Color.ios.secondaryLabel,
    default: Color.android.dynamic.onSurfaceVariant,
  }),
  tint: Platform.select({ ios: Color.ios.systemBlue, default: Color.android.dynamic.primary }),
};
