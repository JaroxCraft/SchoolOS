import { Row, Text } from "@expo/ui";
import { Button, Image } from "@expo/ui/swift-ui";
import {
  accessibilityAddTraits,
  accessibilityLabel as a11yLabel,
  accessibilityValue,
  buttonStyle,
} from "@expo/ui/swift-ui/modifiers";
import * as Haptics from "expo-haptics";

import type { TaskCheckboxProps } from "@/components/task-checkbox";
import { useInk } from "@/hooks/use-ink";

// iOS: an empty circle that becomes a ring with a filled dot, like in Reminders. The universal
// Checkbox is a switch on iOS. A selection haptic fires together with the change, and VoiceOver
// reads it as a toggle with the task's name and its state.
export function TaskCheckbox({
  value,
  onValueChange,
  label,
  accessibilityLabel,
  color = "#007AFF",
}: TaskCheckboxProps) {
  const ink = useInk();
  const spokenLabel = accessibilityLabel ?? label;

  const toggle = () => {
    Haptics.selectionAsync();
    onValueChange(!value);
  };

  return (
    <Button
      onPress={toggle}
      modifiers={[
        buttonStyle("borderless"),
        accessibilityAddTraits(["isToggle"]),
        accessibilityValue(value ? "Erledigt" : "Offen"),
        ...(spokenLabel ? [a11yLabel(spokenLabel)] : []),
      ]}>
      <Row spacing={10} alignment="center">
        <Image
          systemName={value ? "largecircle.fill.circle" : "circle"}
          size={22}
          color={value ? color : ink.secondary}
        />
        {label ? <Text textStyle={{ color: ink.label }}>{label}</Text> : null}
      </Row>
    </Button>
  );
}
