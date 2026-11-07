import type { TextProps } from "@expo/ui";
import { font } from "@expo/ui/swift-ui/modifiers";

import type { TextStyleName } from "@/lib/typography";

export type { TextStyleName } from "@/lib/typography";

type Typography = Pick<TextProps, "textStyle" | "modifiers">;

// iOS: the Dynamic Type text style, which grows and shrinks with the user's text size (Apple HIG,
// typography). A fixed fontSize would stay the same at every setting.
export function typography(
  style: TextStyleName,
  { color, bold }: { color: string; bold?: boolean }
): Typography {
  return {
    textStyle: { color },
    modifiers: [font({ textStyle: style, weight: bold ? "bold" : undefined })],
  };
}
