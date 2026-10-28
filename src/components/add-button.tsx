import { Host } from "@expo/ui";
import { FloatingActionButton, Icon } from "@expo/ui/jetpack-compose";

import { useToolbarIcon } from "@/hooks/use-toolbar-icon";

export type AddButtonProps = {
  onPress: () => void;
};

// Android: the Material floating action button.
export function AddButton({ onPress }: AddButtonProps) {
  const icon = useToolbarIcon("plus", "add");

  // The Material Symbol loads asynchronously
  if (!icon || typeof icon === "string") return null;

  return (
    <Host matchContents>
      <FloatingActionButton onClick={onPress}>
        <FloatingActionButton.Icon>
          <Icon source={icon} size={24} />
        </FloatingActionButton.Icon>
      </FloatingActionButton>
    </Host>
  );
}
