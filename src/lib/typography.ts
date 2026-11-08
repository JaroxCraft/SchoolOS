import type { TextProps } from "@expo/ui";

export type TextStyleName = "title2" | "footnote";

// The size of each text style on Android, in sp (scales with the system font size)
const ANDROID_SIZES: Record<TextStyleName, number> = {
  title2: 22,
  footnote: 13,
};

export type Typography = Pick<TextProps, "textStyle" | "modifiers">;
export type TypographyOptions = { color: string; bold?: boolean };

// Props for an @expo/ui <Text> in one of the system text styles, so it follows the user's text
// size. iOS uses the Dynamic Type style itself (typography.ios.ts).
export function typography(style: TextStyleName, { color, bold }: TypographyOptions): Typography {
  return {
    textStyle: { color, fontSize: ANDROID_SIZES[style], fontWeight: bold ? "700" : undefined },
  };
}
