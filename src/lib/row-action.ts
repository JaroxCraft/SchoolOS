import type { AndroidSymbol, SFSymbol } from "expo-symbols";

// An action of a list row: a swipe button and an item of its long-press menu (see <RowActions>)
export type RowAction = {
  label: string;
  icon: SFSymbol;
  onPress: () => void;
  destructive?: boolean;
  // The action asks before it deletes (entries, subjects, teachers). Its swipe button is red without the
  // destructive role: with that role iOS removes the row at once, even if the user cancels.
  asksFirst?: boolean;
  // Background of the swipe button, e.g. green for "Erledigt"
  tint?: string;
};

// The icon of a row (see <RowIcon>)
export type RowSymbol = {
  sf: SFSymbol;
  md: AndroidSymbol;
  // iOS: background of the icon square, like the system Settings app. Android: the icon's color
  // on a light tint of it.
  color: string;
};
