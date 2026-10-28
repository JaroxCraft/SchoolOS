import { Button, Text } from "@expo/ui";

import { useInk } from "@/hooks/use-ink";

type DestructiveButtonProps = {
  label: string;
  onPress: () => void;
};

// A text button in red for deleting things.
export function DestructiveButton({ label, onPress }: DestructiveButtonProps) {
  const ink = useInk();

  return (
    <Button variant="text" onPress={onPress}>
      <Text textStyle={{ color: ink.danger }}>{label}</Text>
    </Button>
  );
}
