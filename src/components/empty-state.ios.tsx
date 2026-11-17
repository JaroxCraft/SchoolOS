import { Button, ContentUnavailableView, Host } from "@expo/ui/swift-ui";
import { buttonStyle } from "@expo/ui/swift-ui/modifiers";
import type { SFSymbol } from "expo-symbols";
import { Platform } from "react-native";

import { type EmptyStateProps, EmptyStateView } from "@/components/empty-state-view";

// ContentUnavailableView draws nothing before iOS 17, while the app runs from iOS 16.4
const HAS_CONTENT_UNAVAILABLE_VIEW = parseInt(String(Platform.Version), 10) >= 17;

export function EmptyState(props: EmptyStateProps) {
  if (!HAS_CONTENT_UNAVAILABLE_VIEW) return <EmptyStateView {...props} />;

  const { icon, title, message, action } = props;
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
