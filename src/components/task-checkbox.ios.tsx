import { Row, Text } from "@expo/ui";
import { Button, Image } from "@expo/ui/swift-ui";
import { buttonStyle } from "@expo/ui/swift-ui/modifiers";

import type { TaskCheckboxProps } from "@/components/task-checkbox";
import { useInk } from "@/hooks/use-ink";

// iOS: a circle that fills with a checkmark, like in Reminders. The universal Checkbox is a
// switch on iOS.
export function TaskCheckbox({ value, onValueChange, label }: TaskCheckboxProps) {
  const ink = useInk();

  return (
    <Button onPress={() => onValueChange(!value)} modifiers={[buttonStyle("borderless")]}>
      <Row spacing={10} alignment="center">
        <Image
          systemName={value ? "checkmark.circle.fill" : "circle"}
          size={22}
          color={value ? "#007AFF" : ink.secondary}
        />
        {label ? <Text textStyle={{ color: ink.label }}>{label}</Text> : null}
      </Row>
    </Button>
  );
}
