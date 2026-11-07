import { Box, Icon } from "@expo/ui/jetpack-compose";
import { background, clip, Shapes, size } from "@expo/ui/jetpack-compose/modifiers";
import type { AndroidSymbol, SFSymbol } from "expo-symbols";

import { useSymbol } from "@/hooks/use-symbol";

export type RowSymbol = {
  sf: SFSymbol;
  md: AndroidSymbol;
  // iOS: background of the icon square, like the system Settings app. Android: the icon's color
  // on a light tint of it.
  color: string;
};

// Android: the Material Symbol in its color on a round tonal background of the same color, like
// the settings of Pixel phones.
export function RowIcon({ sf, md, color }: RowSymbol) {
  const source = useSymbol(sf, md);
  if (!source || typeof source === "string") return null;

  return (
    <Box
      contentAlignment="center"
      modifiers={[size(40, 40), clip(Shapes.Circle), background(`${color}2E`)]}>
      <Icon source={source} size={22} tint={color} />
    </Box>
  );
}
