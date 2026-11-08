import { FieldGroup } from "@expo/ui";
import type { ModifierConfig } from "@expo/ui/jetpack-compose/modifiers";
import { onTapGesture, scrollDismissesKeyboard } from "@expo/ui/swift-ui/modifiers";
import type { ReactNode } from "react";

import { endEditing } from "@/lib/focused-fields";

export type FormGroupProps = {
  children: ReactNode;
  // More modifiers of the list, e.g. the navigation title inside a sheet
  modifiers?: ModifierConfig[];
  // Android: leaves room at the end, so the floating "+" button never covers the last row
  floatingButton?: boolean;
};

// Tapping the list beside a text field or scrolling it ends the editing: the keyboard closes and
// the cursor leaves the field. The rows and fields keep handling their own taps.
const DISMISS_ON_TAP = [onTapGesture(endEditing), scrollDismissesKeyboard("immediately")];

// iOS: the native grouped list (SwiftUI Form), for a list inside an existing host such as a sheet.
// A screen uses <FormList>. Android: form-group.android.tsx.
export function FormGroup({ children, modifiers = [] }: FormGroupProps) {
  return <FieldGroup modifiers={[...modifiers, ...DISMISS_ON_TAP]}>{children}</FieldGroup>;
}
