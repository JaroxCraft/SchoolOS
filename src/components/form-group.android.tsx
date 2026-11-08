import { FieldGroup } from "@expo/ui";
import { Column, LazyColumn, useMaterialColors } from "@expo/ui/jetpack-compose";
import {
  background,
  clickable,
  fillMaxSize,
  type ModifierConfig,
  padding,
} from "@expo/ui/jetpack-compose/modifiers";
import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

import type { FormGroupProps } from "@/components/form-group";
import { type Ink, useInk } from "@/hooks/use-ink";
import { endEditing } from "@/lib/focused-fields";

// Space between the sections, as in the FieldGroup of @expo/ui
const SECTION_GAP = 24;
const EDGE_PADDING = 16;

// Tapping beside the fields and rows ends the editing: the keyboard closes and the cursor leaves
// the field. The rows and fields keep handling their own taps.
const DISMISS_ON_TAP = clickable(endEditing, { indication: false });

type SectionElement = ReactElement<{ children?: ReactNode; modifiers?: ModifierConfig[] }>;

type RowFactory = {
  asListItem?: (props: unknown, ink: Ink) => ReactElement;
  // A wrapper without a look of its own on Android (RowActions): its row is used instead
  unwrap?: true;
};

// Replaces row components (NavigationRow, EntryRow …) in the sections by the list items they
// render, see RowComponent. Fragments, arrays and RowActions are flattened like the sections do.
function expandRows(node: ReactNode, ink: Ink): ReactNode {
  return Children.map(node, (child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return child;
    const type = child.type as RowFactory;
    if (child.type === Fragment || type.unwrap) return expandRows(child.props.children, ink);
    return type.asListItem
      ? cloneElement(type.asListItem(child.props, ink), { key: child.key })
      : child;
  });
}

// The sections of the list, each with half the gap above and below inside its tappable area: the
// list swallows taps between its items, so this way every tap beside a field lands on a section.
// Rows outside a section are grouped into one, like FieldGroup does.
function expandSections(node: ReactNode, ink: Ink): ReactElement[] {
  const sections: ReactElement[] = [];
  let loose: ReactNode[] = [];

  const add = (section: SectionElement, key: string) =>
    sections.push(
      cloneElement(
        section,
        {
          key,
          modifiers: [
            ...(section.props.modifiers ?? []),
            DISMISS_ON_TAP,
            padding(0, SECTION_GAP / 2, 0, SECTION_GAP / 2),
          ],
        },
        expandRows(section.props.children, ink)
      )
    );
  const flush = () => {
    if (loose.length === 0) return;
    add(<FieldGroup.Section>{loose}</FieldGroup.Section>, `loose-${sections.length}`);
    loose = [];
  };

  const visit = (children: ReactNode) =>
    Children.forEach(children, (child) => {
      if (child == null || typeof child === "boolean") return;
      if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
        visit(child.props.children);
      } else if (isValidElement(child) && child.type === FieldGroup.Section) {
        flush();
        add(child as SectionElement, String(child.key ?? `section-${sections.length}`));
      } else {
        loose.push(child);
      }
    });

  visit(node);
  flush();
  return sections;
}

// Android: the grouped list of FieldGroup (a Compose LazyColumn on the Material surface), built
// here so that every tap beside a field ends the editing. The list swallows taps between and below
// its items, so the sections carry the gaps inside their tappable area, and the list is only as
// tall as its content inside a tappable column that fills the rest. For a list inside an existing
// host such as a sheet; a screen uses <FormList>. iOS: form-group.tsx.
export function FormGroup({ children, modifiers = [], floatingButton }: FormGroupProps) {
  const ink = useInk();
  const colors = useMaterialColors();

  return (
    <Column modifiers={[fillMaxSize(), background(colors.surface), DISMISS_ON_TAP, ...modifiers]}>
      <LazyColumn
        contentPadding={{
          start: EDGE_PADDING,
          end: EDGE_PADDING,
          top: EDGE_PADDING - SECTION_GAP / 2,
          bottom: EDGE_PADDING - SECTION_GAP / 2,
        }}>
        {expandSections(children, ink)}
        {floatingButton && (
          // As much room as before, when the gap above it was the list's spacing
          <FieldGroup.Section key="floating-button" style={{ height: 64 + SECTION_GAP }}>
            {null}
          </FieldGroup.Section>
        )}
      </LazyColumn>
    </Column>
  );
}
