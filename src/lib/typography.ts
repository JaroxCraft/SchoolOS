import type { TextProps } from "@expo/ui";

export type TextStyleName = "title2" | "subheadline" | "footnote";

// The size of each text style on Android, in sp (scales with the system font size)
const ANDROID_SIZES: Record<TextStyleName, number> = {
  title2: 22,
  subheadline: 15,
  footnote: 13,
};

type Typography = Pick<TextProps, "textStyle" | "modifiers">;

// Props for an @expo/ui <Text> in one of the system text styles, so it follows the user's text
// size. iOS uses the Dynamic Type style itself (typography.ios.ts).
export function typography(
  style: TextStyleName,
  { color, bold }: { color: string; bold?: boolean }
): Typography {
  return {
    textStyle: { color, fontSize: ANDROID_SIZES[style], fontWeight: bold ? "700" : undefined },
  };
}
