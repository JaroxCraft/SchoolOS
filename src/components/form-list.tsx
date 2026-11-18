import { Host, Text } from "@expo/ui";

import { FormGroup, type FormGroupProps } from "@/components/form-group";
import { useInk } from "@/hooks/use-ink";
import { typography } from "@/lib/typography";

export function FormList({ children, floatingButton, rowsKey }: Omit<FormGroupProps, "modifiers">) {
  return (
    <Host style={{ flex: 1 }}>
      <FormGroup floatingButton={floatingButton} rowsKey={rowsKey}>
        {children}
      </FormGroup>
    </Host>
  );
}

export function rowsKey(...sections: { id: number }[][]): number {
  const values = sections.flatMap((section) => [...section.map((row) => row.id), -1]);
  return fnv1a(values);
}

function fnv1a(values: number[]): number {
  let hash = 0x811c9dc5;
  for (const value of values) {
    hash = Math.imul(hash ^ value, 0x01000193);
  }
  return hash >>> 0;
}

// Secondary text in the footnote style: the explanation below a section and the details of a row.
// As a footer, use it inside <FieldGroup.SectionFooter> directly in the section: the section only
// recognizes its footer when that element is its direct child, otherwise the text is drawn as a
// row of its own.
export function SecondaryText({ children }: { children: string }) {
  const ink = useInk();

  return <Text {...typography("footnote", { color: ink.secondary })}>{children}</Text>;
}
