import { Icon } from "@expo/ui";
import type { AndroidSymbol, SFSymbol } from "expo-symbols";

import { useInk } from "@/hooks/use-ink";
import { useSymbol } from "@/hooks/use-symbol";

export type RowSymbol = {
  sf: SFSymbol;
  md: AndroidSymbol;
  // Background of the icon square on iOS, like the system Settings app
  color: string;
};

// Android: the plain Material Symbol in the secondary color, as Material lists show leading icons.
export function RowIcon({ sf, md }: RowSymbol) {
  const ink = useInk();
  const name = useSymbol(sf, md);
  if (!name) return null;

  return <Icon name={name} size={24} color={ink.secondary} />;
}
