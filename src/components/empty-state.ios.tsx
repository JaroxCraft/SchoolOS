import { Button, ContentUnavailableView, Host } from "@expo/ui/swift-ui";
import { buttonStyle } from "@expo/ui/swift-ui/modifiers";
import type { SFSymbol } from "expo-symbols";

import type { EmptyStateProps } from "@/components/empty-state";

// iOS: the system's ContentUnavailableView, the placeholder of the Apple apps for a screen
// without content, with the next step as a prominent button.
export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  const systemImage = (typeof icon === "object" ? icon.ios : icon) as SFSymbol | undefined;

  return (
    <Host style={{ flex: 1 }}>
      <ContentUnavailableView
        title={title}
        systemImage={systemImage}
        description={message}
        actions={
          action && (
            <Button
              label={action.label}
              onPress={action.onPress}
              modifiers={[buttonStyle("borderedProminent")]}
            />
          )
        }
      />
    </Host>
  );
}
