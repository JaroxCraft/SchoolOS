import { Button, Icon, ListItem, type ListItemProps, Row, Spacer } from "@expo/ui";
import type { AndroidSymbol, SFSymbol } from "expo-symbols";
import { Platform } from "react-native";

import { useInk } from "@/hooks/use-ink";
import { useSymbol } from "@/hooks/use-symbol";

// Every tappable row shows what it does: a chevron opens a screen, an accent-colored label runs an
// action (add, write an email). Rows without either only show a value (LabeledRow).

export type RowSymbol = {
  sf: SFSymbol;
  md: AndroidSymbol;
  // Background of the icon square on iOS, like the system Settings app
  color: string;
};

// iOS: a white symbol on a colored rounded square. Android: the plain symbol in the secondary
// color, as Material lists show leading icons.
export function RowIcon({ sf, md, color }: RowSymbol) {
  const ink = useInk();
  const name = useSymbol(sf, md);
  if (!name) return null;

  if (Platform.OS !== "ios") return <Icon name={name} size={24} color={ink.secondary} />;

  return (
    <Row
      alignment="center"
      style={{ width: 29, height: 29, borderRadius: 7, backgroundColor: color }}>
      <Spacer flexible />
      <Icon name={name} size={15} color="#FFFFFF" />
      <Spacer flexible />
    </Row>
  );
}

function Chevron() {
  const ink = useInk();
  const name = useSymbol("chevron.right", "chevron_right");
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
      trailing={<Chevron />}
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
