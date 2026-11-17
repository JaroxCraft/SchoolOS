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
  modifiers?: ModifierConfig[];
  floatingButton?: boolean;
  rowsKey?: number;
};

const ROWS_ANIMATION = Animation.smooth({ duration: 0.35 });

// Tapping the list beside a text field or scrolling it ends the editing: the keyboard closes and
// the cursor leaves the field. Buttons and fields keep handling their own taps, but a
// NavigationLink does not get them any more: put it in a plain FieldGroup.
const DISMISS_ON_TAP = [onTapGesture(endEditing), scrollDismissesKeyboard("immediately")];

export function FormGroup({ children, modifiers = [], rowsKey }: FormGroupProps) {
  const reducedMotion = useReducedMotion();
  const animated =
    rowsKey !== undefined && !reducedMotion ? [animation(ROWS_ANIMATION, rowsKey)] : [];

  return (
    <FieldGroup modifiers={[...modifiers, ...animated, ...DISMISS_ON_TAP]}>{children}</FieldGroup>
  );
}
