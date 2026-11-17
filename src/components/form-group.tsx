import { FieldGroup } from "@expo/ui";
import type { ModifierConfig } from "@expo/ui/jetpack-compose/modifiers";
import {
  animation,
  Animation,
  onTapGesture,
  scrollDismissesKeyboard,
} from "@expo/ui/swift-ui/modifiers";
import type { ReactNode } from "react";
import { useReducedMotion } from "react-native-reanimated";

import { endEditing } from "@/lib/focused-fields";

export type FormGroupProps = {
  children: ReactNode;
  // More modifiers of the list, e.g. the navigation title inside a sheet
  modifiers?: ModifierConfig[];
  // Android: leaves room at the end, so the floating "+" button never covers the last row
  floatingButton?: boolean;
  // Set for a list whose rows come and go or move between sections (entries checked off): a value
  // that changes with the rows (see rowsKey), so the list animates the change instead of jumping
  rowsKey?: number;
};

// Rows slide out, in and over to their new place with the list's own motion: a smooth spring
// without bounce, as the system lists use, at the pace of a small state change
const ROWS_ANIMATION = Animation.smooth({ duration: 0.35 });

// Tapping the list beside a text field or scrolling it ends the editing: the keyboard closes and
// the cursor leaves the field. Buttons and fields keep handling their own taps, but a
// NavigationLink does not get them any more: put it in a plain FieldGroup.
const DISMISS_ON_TAP = [onTapGesture(endEditing), scrollDismissesKeyboard("immediately")];

// iOS: the native grouped list (SwiftUI Form), for a list inside an existing host such as a sheet.
// A screen uses <FormList>. Android: form-group.android.tsx.
export function FormGroup({ children, modifiers = [], rowsKey }: FormGroupProps) {
  // Reduce Motion: the rows change in place without sliding
  const reducedMotion = useReducedMotion();
  const animated =
    rowsKey !== undefined && !reducedMotion ? [animation(ROWS_ANIMATION, rowsKey)] : [];

  return (
    <FieldGroup modifiers={[...modifiers, ...animated, ...DISMISS_ON_TAP]}>{children}</FieldGroup>
  );
}
