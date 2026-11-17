import type { AndroidSymbol, SFSymbol } from "expo-symbols";

export type RowAction = {
  label: string;
  icon: SFSymbol;
  onPress: () => void;
  destructive?: boolean;
  // The action asks before it deletes (entries, subjects, teachers). Its swipe button is red without the
  // destructive role: with that role iOS removes the row at once, even if the user cancels.
  asksFirst?: boolean;
  tint?: string;
};

export type RowSymbol = {
  sf: SFSymbol;
  md: AndroidSymbol;
  // iOS: background of the icon square, like the system Settings app. Android: the icon's color
  // on a light tint of it.
  color: string;
};
