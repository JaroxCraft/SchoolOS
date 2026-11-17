import { Host } from "@expo/ui";
import { FloatingActionButton, Icon } from "@expo/ui/jetpack-compose";

import { useSymbol } from "@/hooks/use-symbol";
import { NEW_ENTRY, openScreen } from "@/lib/routes";

export function AddButton() {
  const icon = useSymbol("plus", "add");

  // The Material Symbol loads asynchronously
  if (!icon || typeof icon === "string") return null;

  return (
    <Host matchContents>
      <FloatingActionButton onClick={() => openScreen(NEW_ENTRY)}>
        <FloatingActionButton.Icon>
          <Icon source={icon} size={24} />
        </FloatingActionButton.Icon>
      </FloatingActionButton>
    </Host>
  );
}
