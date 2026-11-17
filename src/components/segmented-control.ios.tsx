import { Picker, Text } from "@expo/ui/swift-ui";
import { pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";

import type { SegmentedControlProps } from "@/components/segmented-control";

export function SegmentedControl<T extends string | number>({
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <Picker
      selection={value}
      onSelectionChange={(selection: T) => onChange(selection)}
      modifiers={[pickerStyle("segmented")]}>
      {options.map((option) => (
        <Text key={String(option.value)} modifiers={[tag(option.value)]}>
          {option.label}
        </Text>
      ))}
    </Picker>
  );
}
