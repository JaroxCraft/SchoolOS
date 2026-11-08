import { Row, Text } from "@expo/ui";
import { Button, Image } from "@expo/ui/swift-ui";
import {
  accessibilityAddTraits,
  accessibilityLabel as a11yLabel,
  accessibilityValue,
  buttonStyle,
  contentShape,
  frame,
  shapes,
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
  // A visible label names the state itself ("Erledigt"), so VoiceOver answers it with yes or no
  // instead of reading "Erledigt, Erledigt"; next to a task's title it reads the state
  const spokenValue = label ? (value ? "Ja" : "Nein") : value ? "Erledigt" : "Offen";

  const toggle = () => {
    Haptics.selectionAsync();
    onValueChange(!value);
  };

  return (
    <Button
      onPress={toggle}
      modifiers={[
        buttonStyle("borderless"),
        // The circle is 22 pt; the whole 44 pt frame takes the tap (Apple HIG), with the circle
        // staying at the leading edge where it was
        frame({ minWidth: 44, minHeight: 44, alignment: "leading" }),
        contentShape(shapes.rectangle()),
        accessibilityAddTraits(["isToggle"]),
        accessibilityValue(spokenValue),
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
