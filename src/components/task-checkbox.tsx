import { Checkbox } from "@expo/ui";

export type TaskCheckboxProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  // Fill color of the checked circle on iOS, e.g. the subject color
  color?: string;
};

// Android: the Material checkbox.
export function TaskCheckbox({ value, onValueChange, label }: TaskCheckboxProps) {
  return <Checkbox value={value} onValueChange={onValueChange} label={label} />;
}
