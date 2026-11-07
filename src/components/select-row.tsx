import { Picker, type PickerItemValue } from "@expo/ui";

import { LabeledRow } from "@/components/labeled-row";

export type SelectOption<T extends PickerItemValue> = {
  label: string;
  value: T;
};

export type SelectRowProps<T extends PickerItemValue> = {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
};

// iOS: the native menu picker next to the label. Android has its own row (select-row.android.tsx).
export function SelectRow<T extends PickerItemValue>({
  label,
  value,
  options,
  onChange,
}: SelectRowProps<T>) {
  return (
    <LabeledRow label={label}>
      <Picker selectedValue={value} onValueChange={onChange}>
        {options.map((option) => (
          <Picker.Item key={option.value} label={option.label} value={option.value} />
        ))}
      </Picker>
    </LabeledRow>
  );
}
