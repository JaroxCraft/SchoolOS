import { Button, Icon, ListItem, type ListItemProps, Text } from "@expo/ui";
import type { AndroidSymbol, SFSymbol } from "expo-symbols";
import * as WebBrowser from "expo-web-browser";
import type { ReactElement } from "react";
import { Platform } from "react-native";

import { RowIcon } from "@/components/row-icon";
import { type Ink, useInk } from "@/hooks/use-ink";
import { useSymbol } from "@/hooks/use-symbol";
import type { RowSymbol } from "@/lib/row-action";

// Row components carry an `asListItem` that returns their list item directly. <FormGroup> uses it
// on Android: there a section draws its direct list items as rows, but wraps any other component
// in a list item of its own, which doubles the padding and makes the row twice as tall.

export type RowComponent<P> = ((props: P) => ReactElement) & {
  asListItem: (props: P, ink: Ink) => ReactElement;
};

function Accessory({ sf, md }: { sf: SFSymbol; md: AndroidSymbol }) {
  const ink = useInk();
  const name = useSymbol(sf, md);
  if (!name) return null;

  return <Icon name={name} size={Platform.OS === "ios" ? 13 : 24} color={ink.tertiary} />;
}

type NavigationRowProps = Omit<ListItemProps, "trailing"> & {
  icon?: RowSymbol;
};

const navigationItem = ({ icon, leading, ...props }: NavigationRowProps) => (
  <ListItem
    {...props}
    leading={icon ? <RowIcon {...icon} /> : leading}
    trailing={<Accessory sf="chevron.right" md="chevron_right" />}
  />
);

export const NavigationRow: RowComponent<NavigationRowProps> = Object.assign(
  (props: NavigationRowProps) => navigationItem(props),
  { asListItem: navigationItem }
);

type LinkRowProps = Omit<ListItemProps, "trailing" | "onPress"> & {
  url: string;
  icon?: RowSymbol;
};

const linkItem = ({ url, icon, leading, ...props }: LinkRowProps) => (
  <ListItem
    {...props}
    onPress={() => WebBrowser.openBrowserAsync(url)}
    leading={icon ? <RowIcon {...icon} /> : leading}
    trailing={<Accessory sf="arrow.up.right" md="open_in_new" />}
  />
);

export const LinkRow: RowComponent<LinkRowProps> = Object.assign(
  (props: LinkRowProps) => linkItem(props),
  { asListItem: linkItem }
);

type ActionRowProps = {
  label: string;
  onPress: () => void;
};

const coloredItem = (label: string, color: string, onPress: () => void, icon?: RowSymbol) => (
  <ListItem onPress={onPress} leading={icon ? <RowIcon {...icon} /> : undefined}>
    <Text textStyle={{ color }}>{label}</Text>
  </ListItem>
);

type IconActionRowProps = ActionRowProps & { icon?: RowSymbol };

export const ActionRow: RowComponent<IconActionRowProps> = Object.assign(
  function ActionRowComponent({ label, onPress, icon }: IconActionRowProps) {
    const ink = useInk();
    if (icon) return coloredItem(label, ink.accent, onPress, icon);
    return <Button variant="text" label={label} onPress={onPress} />;
  },
  {
    asListItem: ({ label, onPress, icon }: IconActionRowProps, ink: Ink) =>
      coloredItem(label, ink.accent, onPress, icon),
  }
);

export const DestructiveRow: RowComponent<ActionRowProps> = Object.assign(
  function DestructiveRowComponent({ label, onPress }: ActionRowProps) {
    const ink = useInk();
    return (
      <Button variant="text" onPress={onPress}>
        <Text textStyle={{ color: ink.danger }}>{label}</Text>
      </Button>
    );
  },
  {
    asListItem: ({ label, onPress }: ActionRowProps, ink: Ink) =>
      coloredItem(label, ink.danger, onPress),
  }
);
