import { SegmentedButton, SingleChoiceSegmentedButtonRow, Text } from "@expo/ui/jetpack-compose";
import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";

export type SegmentedControlProps<T extends string | number> = {
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
};

// Android: a Material single-choice segmented button row. For a few short options that are all
// worth seeing at once, such as the weekdays.
export function SegmentedControl<T extends string | number>({
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
      {options.map((option) => (
        <SegmentedButton
          key={String(option.value)}
          selected={option.value === value}
          onClick={() => onChange(option.value)}>
          <SegmentedButton.Label>
            <Text>{option.label}</Text>
          </SegmentedButton.Label>
        </SegmentedButton>
      ))}
    </SingleChoiceSegmentedButtonRow>
  );
}
