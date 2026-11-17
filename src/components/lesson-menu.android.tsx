import { Box, DropdownMenu, DropdownMenuItem, Host, Text } from "@expo/ui/jetpack-compose";
import { StyleSheet } from "react-native";

import type { LessonMenuProps } from "@/components/lesson-menu";
import { useInk } from "@/hooks/use-ink";

// Android: the Material menu of a long-pressed lesson card, with the actions of the iOS context
// menu, like the long-press menu of a list row (see <FormGroup>). Hangs at the card's top left.
export function LessonMenu({ actions, open, onClose }: LessonMenuProps) {
  const ink = useInk();
  if (!open) return null;

  return (
    <Host style={styles.anchor}>
      <DropdownMenu expanded onDismissRequest={onClose}>
        <DropdownMenu.Trigger>
          <Box />
        </DropdownMenu.Trigger>
        <DropdownMenu.Items>
          {actions.map((action) => (
            <DropdownMenuItem
              key={action.label}
              onClick={() => {
                onClose();
                action.onPress();
              }}>
              <DropdownMenuItem.Text>
                <Text color={ink.label} style={{ typography: "bodyLarge" }}>
                  {action.label}
                </Text>
              </DropdownMenuItem.Text>
            </DropdownMenuItem>
          ))}
        </DropdownMenu.Items>
      </DropdownMenu>
    </Host>
  );
}

const styles = StyleSheet.create({
  anchor: { position: "absolute", top: 0, left: 0, width: 1, height: 1 },
});
