import type { TextInputRef } from "@expo/ui";
import { Keyboard } from "react-native";

// The text fields that hold focus right now. Keyboard.dismiss() only hides the Android keyboard
// and leaves the cursor in a hosted Compose field, so the fields are left through their refs.
const focused = new Set<TextInputRef>();

export function fieldFocused(field: TextInputRef | null, isFocused: boolean) {
  if (!field) return;
  if (isFocused) focused.add(field);
  else focused.delete(field);
}

export function endEditing() {
  focused.forEach((field) => field.blur());
  focused.clear();
  Keyboard.dismiss();
}
