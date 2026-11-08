import { Host, Text } from "@expo/ui";

import { FormGroup, type FormGroupProps } from "@/components/form-group";
import { useInk } from "@/hooks/use-ink";
import { typography } from "@/lib/typography";

// Native grouped list (SwiftUI Form / Compose) filling the screen, see <FormGroup>.
export function FormList({ children, floatingButton }: Omit<FormGroupProps, "modifiers">) {
  return (
    <Host style={{ flex: 1 }}>
      <FormGroup floatingButton={floatingButton}>{children}</FormGroup>
    </Host>
  );
}

// Explanation below a section. Use it inside <FieldGroup.SectionFooter> directly in the section:
// the section only recognizes its footer when that element is its direct child, otherwise the
// text is drawn as a row of its own.
export function FooterText({ children }: { children: string }) {
  const ink = useInk();

  return <Text {...typography("footnote", { color: ink.secondary })}>{children}</Text>;
}
