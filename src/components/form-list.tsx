import { Host, Text } from "@expo/ui";

import { FormGroup, type FormGroupProps } from "@/components/form-group";
import { useInk } from "@/hooks/use-ink";
import { typography } from "@/lib/typography";

// Native grouped list (SwiftUI Form / Compose) filling the screen, see <FormGroup>.
export function FormList({ children, floatingButton, rowsKey }: Omit<FormGroupProps, "modifiers">) {
  return (
    <Host style={{ flex: 1 }}>
      <FormGroup floatingButton={floatingButton} rowsKey={rowsKey}>
        {children}
      </FormGroup>
    </Host>
  );
}

// The rowsKey of a list with these rows, one array per section in order: it changes when a row
// is added, removed or moves to another section, and stays the same otherwise
export function rowsKey(...sections: { id: number }[][]): number {
  // FNV-1a over the ids, with a separator between the sections
  let hash = 0x811c9dc5;
  for (const section of sections) {
    for (const value of [...section.map((row) => row.id), -1]) {
      hash = Math.imul(hash ^ value, 0x01000193);
    }
  }
  return hash >>> 0;
}

// Explanation below a section. Use it inside <FieldGroup.SectionFooter> directly in the section:
// the section only recognizes its footer when that element is its direct child, otherwise the
// text is drawn as a row of its own.
export function FooterText({ children }: { children: string }) {
  const ink = useInk();

  return <Text {...typography("footnote", { color: ink.secondary })}>{children}</Text>;
}
