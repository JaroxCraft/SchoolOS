import { FieldGroup, Host, Text } from "@expo/ui";
import { clickable, type ModifierConfig } from "@expo/ui/jetpack-compose/modifiers";
import { onTapGesture, scrollDismissesKeyboard } from "@expo/ui/swift-ui/modifiers";
import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { Platform } from "react-native";

import { type Ink, useInk } from "@/hooks/use-ink";
import { endEditing } from "@/lib/focused-fields";

// Tapping the list beside a text field (iOS also: scrolling it) ends the editing: the keyboard
// closes and the cursor leaves the field. The rows and fields keep handling their own taps.
const DISMISS_ON_TAP =
  Platform.OS === "ios"
    ? [onTapGesture(endEditing), scrollDismissesKeyboard("immediately")]
    : [clickable(endEditing, { indication: false })];

type RowFactory = { asListItem?: (props: unknown, ink: Ink) => ReactElement };

// Android: replaces row components (NavigationRow, EntryRow …) in the sections by the list items
// they render, see RowComponent. Fragments and arrays are flattened like the sections do.
function expandRows(node: ReactNode, ink: Ink): ReactNode {
  return Children.map(node, (child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return child;
    if (child.type === Fragment) return expandRows(child.props.children, ink);
    const factory = (child.type as RowFactory).asListItem;
    return factory ? cloneElement(factory(child.props, ink), { key: child.key }) : child;
  });
}

function expandSections(node: ReactNode, ink: Ink): ReactNode {
  return Children.map(node, (child) => {
    if (!isValidElement<{ children?: ReactNode; modifiers?: ModifierConfig[] }>(child)) {
      return child;
    }
    if (child.type === Fragment) return expandSections(child.props.children, ink);
    if (child.type !== FieldGroup.Section) return child;
    // A tap on the section beside its fields and rows ends the editing; the list itself does not
    // receive taps on Android
    return cloneElement(
      child as ReactElement<{ children?: ReactNode; modifiers?: ModifierConfig[] }>,
      { modifiers: [...(child.props.modifiers ?? []), ...DISMISS_ON_TAP] },
      expandRows(child.props.children, ink)
    );
  });
}

// Native grouped list (SwiftUI Form / Compose) filling the screen. On Android, `floatingButton`
// leaves room at the end, so the floating "+" button never covers the last row.
export function FormList({
  children,
  floatingButton,
}: {
  children: ReactNode;
  floatingButton?: boolean;
}) {
  const ink = useInk();

  return (
    <Host style={{ flex: 1 }}>
      <FieldGroup modifiers={DISMISS_ON_TAP}>
        {Platform.OS === "android" ? expandSections(children, ink) : children}
        {floatingButton && Platform.OS === "android" && (
          <FieldGroup.Section style={{ height: 64 }}>{null}</FieldGroup.Section>
        )}
      </FieldGroup>
    </Host>
  );
}

// Explanation below a section. Use it inside <FieldGroup.SectionFooter> directly in the section:
// the section only recognizes its footer when that element is its direct child, otherwise the
// text is drawn as a row of its own.
export function FooterText({ children }: { children: string }) {
  const ink = useInk();

  return <Text textStyle={{ color: ink.secondary, fontSize: 13 }}>{children}</Text>;
}
