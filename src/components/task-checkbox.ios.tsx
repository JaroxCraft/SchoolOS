import { Row, Text } from "@expo/ui";
import { Button, Image } from "@expo/ui/swift-ui";
import { buttonStyle } from "@expo/ui/swift-ui/modifiers";

import type { TaskCheckboxProps } from "@/components/task-checkbox";
import { useInk } from "@/hooks/use-ink";

// iOS: an empty circle that becomes a ring with a filled dot, like in Reminders. The universal
// Checkbox is a switch on iOS.
export function TaskCheckbox({
  value,
  onValueChange,
  label,
  color = "#007AFF",
}: TaskCheckboxProps) {
  const ink = useInk();

  return (
    <Button onPress={() => onValueChange(!value)} modifiers={[buttonStyle("borderless")]}>
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
