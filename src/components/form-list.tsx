import { FieldGroup, Host, Text } from "@expo/ui";
import type { ReactNode } from "react";

import { useInk } from "@/hooks/use-ink";

// Native grouped list (SwiftUI Form / Compose) filling the screen.
export function FormList({ children }: { children: ReactNode }) {
  return (
    <Host style={{ flex: 1 }}>
      <FieldGroup>{children}</FieldGroup>
    </Host>
  );
}

// Explanation below a section.
export function FormFooter({ children }: { children: string }) {
  const ink = useInk();

  return (
    <FieldGroup.SectionFooter>
      <Text textStyle={{ color: ink.secondary, fontSize: 13 }}>{children}</Text>
    </FieldGroup.SectionFooter>
  );
}
