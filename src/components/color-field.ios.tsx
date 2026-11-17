import { ColorPicker } from "@expo/ui/swift-ui";

import type { ColorFieldProps } from "@/components/color-field";

export function ColorField({ value, onChange }: ColorFieldProps) {
  return (
    <ColorPicker
      label="Farbe"
      selection={value}
      supportsOpacity={false}
      onSelectionChange={(color) => color && onChange(color.slice(0, 7).toUpperCase())}
    />
  );
}
