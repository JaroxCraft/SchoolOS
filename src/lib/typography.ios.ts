import { font } from "@expo/ui/swift-ui/modifiers";

import type { TextStyleName, Typography, TypographyOptions } from "@/lib/typography";

// iOS: the Dynamic Type text style, which grows and shrinks with the user's text size (Apple HIG,
// typography). A fixed fontSize would stay the same at every setting.
export function typography(style: TextStyleName, { color, bold }: TypographyOptions): Typography {
  return {
    textStyle: { color },
    modifiers: [font({ textStyle: style, weight: bold ? "bold" : undefined })],
  };
}
