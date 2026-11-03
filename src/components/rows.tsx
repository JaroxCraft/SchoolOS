import { Button, Icon, ListItem, type ListItemProps } from "@expo/ui";
import type { AndroidSymbol, SFSymbol } from "expo-symbols";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import { RowIcon, type RowSymbol } from "@/components/row-icon";
import { useInk } from "@/hooks/use-ink";
import { useSymbol } from "@/hooks/use-symbol";

// Every tappable row shows what it does: a chevron opens a screen, an arrow opens a web page, an
// accent-colored label runs an action (add, write an email). Rows without either only show a value
// (LabeledRow).

function Accessory({ sf, md }: { sf: SFSymbol; md: AndroidSymbol }) {
  const ink = useInk();
  const name = useSymbol(sf, md);
  if (!name) return null;

  return <Icon name={name} size={Platform.OS === "ios" ? 13 : 24} color={ink.tertiary} />;
}

type NavigationRowProps = Omit<ListItemProps, "trailing"> & {
  icon?: RowSymbol;
};

// Opens another screen: disclosure chevron on the right, optionally an icon on the left.
export function NavigationRow({ icon, leading, ...props }: NavigationRowProps) {
  return (
    <ListItem
      // Android: same background as the other rows of the section
      colors={{ containerColor: "transparent" }}
      {...props}
      leading={icon ? <RowIcon {...icon} /> : leading}
      trailing={<Accessory sf="chevron.right" md="chevron_right" />}
    />
  );
}

type LinkRowProps = Omit<ListItemProps, "trailing" | "onPress"> & {
  url: string;
  icon?: RowSymbol;
};

// Opens a web page in the in-app browser: an arrow pointing out of the app on the right.
export function LinkRow({ url, icon, leading, ...props }: LinkRowProps) {
  return (
    <ListItem
      // Android: same background as the other rows of the section
      colors={{ containerColor: "transparent" }}
      {...props}
      onPress={() => WebBrowser.openBrowserAsync(url)}
      leading={icon ? <RowIcon {...icon} /> : leading}
      trailing={<Accessory sf="arrow.up.right" md="open_in_new" />}
    />
  );
}

type ActionRowProps = {
  label: string;
  onPress: () => void;
};

// Runs an action right away: a text button in the accent color (system blue / Material primary).
export function ActionRow({ label, onPress }: ActionRowProps) {
  return <Button variant="text" label={label} onPress={onPress} />;
}
