import { Icon, ListItem, type ListItemProps, Text } from "@expo/ui";
import type { AndroidSymbol, SFSymbol } from "expo-symbols";
import * as WebBrowser from "expo-web-browser";
import type { ReactElement } from "react";
import { Platform } from "react-native";

import { SecondaryText } from "@/components/form-list";
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

// The details below a row's label. @expo/ui draws a plain string there in the label color on iOS,
// so details are passed as secondary text, like those of the entries.
export const rowDetail = (text: string | undefined) =>
  text ? <SecondaryText>{text}</SecondaryText> : undefined;

const navigationItem = ({ icon, leading, supportingText, ...props }: NavigationRowProps) => (
  <ListItem
    {...props}
    supportingText={typeof supportingText === "string" ? rowDetail(supportingText) : supportingText}
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

// A whole-row button with its label in the accent (or danger) color. A plain text button would
// show the label in the text color on iOS and only take taps on the label itself.
const coloredItem = (label: string, color: string, onPress: () => void, icon?: RowSymbol) => (
  <ListItem onPress={onPress} leading={icon ? <RowIcon {...icon} /> : undefined}>
    <Text textStyle={{ color }}>{label}</Text>
  </ListItem>
);

type IconActionRowProps = ActionRowProps & { icon?: RowSymbol };

const actionItem = ({ label, onPress, icon }: IconActionRowProps, ink: Ink) =>
  coloredItem(label, ink.accent, onPress, icon);

export const ActionRow: RowComponent<IconActionRowProps> = Object.assign(
  function ActionRowComponent(props: IconActionRowProps) {
    return actionItem(props, useInk());
  },
  { asListItem: actionItem }
);

const destructiveItem = ({ label, onPress }: ActionRowProps, ink: Ink) =>
  coloredItem(label, ink.danger, onPress);

export const DestructiveRow: RowComponent<ActionRowProps> = Object.assign(
  function DestructiveRowComponent(props: ActionRowProps) {
    return destructiveItem(props, useInk());
  },
  { asListItem: destructiveItem }
);
