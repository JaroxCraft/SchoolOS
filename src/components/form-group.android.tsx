import { FieldGroup, type ListItemProps } from "@expo/ui";
import {
  Box,
  Column,
  DropdownMenu,
  LazyColumn,
  Text,
  useMaterialColors,
} from "@expo/ui/jetpack-compose";
import {
  animateContentSize,
  background,
  clickable,
  combinedClickable,
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
  useState,
} from "react";

import { ActionMenuItems } from "@/components/action-menu-items";
import type { FormGroupProps } from "@/components/form-group";
import type { RowActionsProps } from "@/components/row-actions";
import { type Ink, useInk } from "@/hooks/use-ink";
import { endEditing } from "@/lib/focused-fields";
import type { RowAction } from "@/lib/row-action";

const SECTION_GAP = 24;
const EDGE_PADDING = 16;
const FLOATING_BUTTON_HEIGHT = 64;

const DISMISS_ON_TAP = clickable(endEditing, { indication: false });

type SectionElement = ReactElement<{ children?: ReactNode; modifiers?: ModifierConfig[] }>;

type RowFactory = {
  asListItem?: (props: unknown, ink: Ink) => ReactElement;
  rowActions?: true;
};

type Rows = {
  ink: Ink;
  openMenu: string | null;
  setOpenMenu: (key: string | null) => void;
};

// A row with RowActions: a long press opens a Material menu at the row with its actions (see
// ActionMenuItems); a tap does what it did before. The menu hangs on the row's trailing content
// (e.g. the chevron), so the row stays the section's own list item.
function withMenu(item: ReactElement<ListItemProps>, menu: RowAction[], key: string, rows: Rows) {
  const { openMenu, setOpenMenu } = rows;
  const { onPress, trailing, modifiers } = item.props;
  const close = () => setOpenMenu(null);

  return cloneElement(item, {
    key,
    onPress: undefined,
    // Compose gives the long press its haptic
    modifiers: [
      ...(modifiers ?? []),
      combinedClickable({ onClick: onPress, onLongClick: () => setOpenMenu(key) }),
    ],
    trailing: (
      <DropdownMenu expanded={openMenu === key} onDismissRequest={close}>
        <DropdownMenu.Trigger>
          {typeof trailing === "string" ? <Text>{trailing}</Text> : (trailing ?? <Box />)}
        </DropdownMenu.Trigger>
        <DropdownMenu.Items>
          <ActionMenuItems actions={menu} onClose={close} />
        </DropdownMenu.Items>
      </DropdownMenu>
    ),
  });
}

function expandRows(node: ReactNode, rows: Rows, prefix: string): ReactNode {
  return Children.map(node, (child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return child;
    const type = child.type as RowFactory;
    if (child.type === Fragment) return expandRows(child.props.children, rows, prefix);
    if (type.rowActions) {
      const { menu, children } = child.props as RowActionsProps;
      const key = `${prefix}/${String(child.key)}`;
      const [item] = Children.toArray(expandRows(children, rows, key));
      return isValidElement<ListItemProps>(item) && menu?.length
        ? withMenu(item, menu, key, rows)
        : item;
    }
    if (type.asListItem) {
      const key = `${prefix}/${String(child.key)}`;
      const [item] = Children.toArray(
        expandRows(type.asListItem(child.props, rows.ink), rows, key)
      );
      return isValidElement(item) ? cloneElement(item, { key: child.key }) : item;
    }
    return child;
  });
}

// The sections of the list, each with half the gap above and below inside its tappable area: the
// list swallows taps between its items, so this way every tap beside a field lands on a section.
// Rows outside a section are grouped into one, like FieldGroup does. With `animateRows` a section
// grows and shrinks smoothly as rows come and go, instead of jumping (Compose follows the system's
// animation scale, so "Remove animations" turns it off).
function expandSections(node: ReactNode, rows: Rows, animateRows: boolean): ReactElement[] {
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
            ...(animateRows ? [animateContentSize()] : []),
          ],
        },
        expandRows(section.props.children, rows, key)
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
export function FormGroup({ children, modifiers = [], floatingButton, rowsKey }: FormGroupProps) {
  const ink = useInk();
  const colors = useMaterialColors();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <Column modifiers={[fillMaxSize(), background(colors.surface), DISMISS_ON_TAP, ...modifiers]}>
      <LazyColumn
        contentPadding={{
          start: EDGE_PADDING,
          end: EDGE_PADDING,
          top: EDGE_PADDING - SECTION_GAP / 2,
          bottom: EDGE_PADDING - SECTION_GAP / 2,
        }}>
        {expandSections(children, { ink, openMenu, setOpenMenu }, rowsKey !== undefined)}
        {floatingButton && (
          <FieldGroup.Section
            key="floating-button"
            style={{ height: FLOATING_BUTTON_HEIGHT + SECTION_GAP }}>
            {null}
          </FieldGroup.Section>
        )}
      </LazyColumn>
    </Column>
  );
}
