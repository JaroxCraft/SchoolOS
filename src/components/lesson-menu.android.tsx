import { Box, DropdownMenu, Host } from "@expo/ui/jetpack-compose";
import { StyleSheet } from "react-native";

import { ActionMenuItems } from "@/components/action-menu-items";
import type { LessonMenuProps } from "@/components/lesson-menu";

export function LessonMenu({ actions, open, onClose }: LessonMenuProps) {
  if (!open) return null;

  return (
    <Host style={styles.anchor}>
      <DropdownMenu expanded onDismissRequest={onClose}>
        <DropdownMenu.Trigger>
          <Box />
        </DropdownMenu.Trigger>
        <DropdownMenu.Items>
          <ActionMenuItems actions={actions} onClose={onClose} />
        </DropdownMenu.Items>
      </DropdownMenu>
    </Host>
  );
}

const styles = StyleSheet.create({
  anchor: { position: "absolute", top: 0, left: 0, width: 1, height: 1 },
});
