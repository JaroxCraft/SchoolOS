import { Checkbox } from "@expo/ui";
import { semantics } from "@expo/ui/jetpack-compose/modifiers";
import * as Haptics from "expo-haptics";

export type TaskCheckboxProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  // What screen readers announce when there is no visible label, e.g. the task's title in a row
  accessibilityLabel?: string;
  // Fill color of the checked circle on iOS, e.g. the subject color
  color?: string;
};

// The haptic of checking a task off or reopening it, from the checkbox or a row action. Android:
// the toggle haptic of the system switches.
export function toggleHaptic(checked: boolean) {
  Haptics.performAndroidHapticsAsync(
    checked ? Haptics.AndroidHaptics.Toggle_On : Haptics.AndroidHaptics.Toggle_Off
  );
}

// Android: the Material checkbox, with the toggle haptic.
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
