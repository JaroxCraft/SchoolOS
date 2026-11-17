import { Box, Icon } from "@expo/ui/jetpack-compose";
import { background, clip, Shapes, size } from "@expo/ui/jetpack-compose/modifiers";

import { useInk } from "@/hooks/use-ink";
import { useSymbol } from "@/hooks/use-symbol";
import type { RowSymbol } from "@/lib/row-action";

// Relative luminance (sRGB, 0 black to 1 white) of a "#RRGGBB" color
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Android: the Material Symbol in its color on a round tonal background of the same color, like
// the settings of Pixel phones. Near-black colors (e.g. the GitHub one) take the label color
// instead, so the glyph stays visible in dark mode.
export function RowIcon({ sf, md, color: symbolColor }: RowSymbol) {
  const ink = useInk();
  const source = useSymbol(sf, md);
  // The Material label is "#RRGGBBAA"; drop its alpha so the tint alpha can be appended
  const color = luminance(symbolColor) < 0.02 ? ink.label.slice(0, 7) : symbolColor;
  if (!source || typeof source === "string") return null;

  return (
    <Box
      contentAlignment="center"
      modifiers={[size(40, 40), clip(Shapes.Circle), background(`${color}2E`)]}>
      <Icon source={source} size={22} tint={color} />
    </Box>
  );
}
