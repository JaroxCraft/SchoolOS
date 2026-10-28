import { Host } from "@expo/ui";
import { FloatingActionButton, Icon } from "@expo/ui/jetpack-compose";
import { router } from "expo-router";

import { useToolbarIcon } from "@/hooks/use-toolbar-icon";

export const NEW_ENTRY = { pathname: "/entry/[id]", params: { id: "new" } } as const;

// Android: the Material floating action button that opens a new entry.
export function AddButton() {
  const icon = useToolbarIcon("plus", "add");

  // The Material Symbol loads asynchronously
  if (!icon || typeof icon === "string") return null;

  return (
    <Host matchContents>
      <FloatingActionButton onClick={() => router.push(NEW_ENTRY)}>
        <FloatingActionButton.Icon>
          <Icon source={icon} size={24} />
        </FloatingActionButton.Icon>
      </FloatingActionButton>
    </Host>
  );
}
