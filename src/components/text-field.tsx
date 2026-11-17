import { TextInput, type TextInputProps, type TextInputRef } from "@expo/ui";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { useInk } from "@/hooks/use-ink";
import { fieldFocused } from "@/lib/focused-fields";

// A text field of a form. Android draws the placeholder in the text color by default, so it looks
// like an entered value; here it gets the Material outline color. iOS keeps its own placeholder.
// The field registers while it has focus, so tapping beside it can end the editing (endEditing).
export function TextField({ onFocus, onBlur, ...props }: Omit<TextInputProps, "ref">) {
  const ink = useInk();
  const ref = useRef<TextInputRef>(null);
  useEffect(() => {
    const field = ref.current;
    return () => fieldFocused(field, false);
  }, []);

  return (
    <TextInput
      ref={ref}
      placeholderTextColor={Platform.OS === "android" ? ink.tertiary : undefined}
      onFocus={() => {
        fieldFocused(ref.current, true);
        onFocus?.();
      }}
      onBlur={() => {
        fieldFocused(ref.current, false);
        onBlur?.();
      }}
      {...props}
    />
  );
}
