import { DropdownMenuItem, Text } from "@expo/ui/jetpack-compose";

import { useInk } from "@/hooks/use-ink";
import type { RowAction } from "@/lib/row-action";

type ActionMenuItemsProps = {
  actions: RowAction[];
  onClose: () => void;
};

// Android: the items of a long-press menu (a list row's or a lesson card's), with the actions of
// the iOS context menu, the destructive ones in red. A tap closes the menu, then runs the action.
export function ActionMenuItems({ actions, onClose }: ActionMenuItemsProps) {
  const ink = useInk();

  return actions.map((action) => (
    <DropdownMenuItem
      key={action.label}
      onClick={() => {
        onClose();
        action.onPress();
      }}>
      <DropdownMenuItem.Text>
        <Text
          color={action.destructive ? ink.danger : ink.label}
          style={{ typography: "bodyLarge" }}>
          {action.label}
        </Text>
      </DropdownMenuItem.Text>
    </DropdownMenuItem>
  ));
}
