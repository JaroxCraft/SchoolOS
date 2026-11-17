import type { TextProps } from "@expo/ui";

export type TextStyleName = "title2" | "footnote";

const ANDROID_SIZES: Record<TextStyleName, number> = {
  title2: 22,
  footnote: 13,
};

export type Typography = Pick<TextProps, "textStyle" | "modifiers">;
export type TypographyOptions = { color: string; bold?: boolean };

export function typography(style: TextStyleName, { color, bold }: TypographyOptions): Typography {
  return {
    textStyle: { color, fontSize: ANDROID_SIZES[style], fontWeight: bold ? "700" : undefined },
  };
}
