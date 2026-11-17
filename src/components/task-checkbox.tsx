import { Checkbox } from "@expo/ui";
import { semantics } from "@expo/ui/jetpack-compose/modifiers";
import * as Haptics from "expo-haptics";

export type TaskCheckboxProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  accessibilityLabel?: string;
  color?: string;
};

export function toggleHaptic(checked: boolean) {
  Haptics.performAndroidHapticsAsync(
    checked ? Haptics.AndroidHaptics.Toggle_On : Haptics.AndroidHaptics.Toggle_Off
  );
}

export function TaskCheckbox({
  value,
  onValueChange,
  label,
  accessibilityLabel,
}: TaskCheckboxProps) {
  const toggle = (checked: boolean) => {
    toggleHaptic(checked);
    onValueChange(checked);
  };

  return (
    <Checkbox
      value={value}
      onValueChange={toggle}
      label={label}
      modifiers={
        !label && accessibilityLabel
          ? [semantics({ contentDescription: accessibilityLabel })]
          : undefined
      }
    />
  );
}
