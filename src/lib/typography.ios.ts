import { font } from "@expo/ui/swift-ui/modifiers";

import type { TextStyleName, Typography, TypographyOptions } from "@/lib/typography";

export function typography(style: TextStyleName, { color, bold }: TypographyOptions): Typography {
  return {
    textStyle: { color },
    modifiers: [font({ textStyle: style, weight: bold ? "bold" : undefined })],
  };
}
