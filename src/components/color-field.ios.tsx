import { ColorPicker } from "@expo/ui/swift-ui";

import type { ColorFieldProps } from "@/components/color-field";

// iOS: the system color picker. The row shows the color well; tapping it opens Apple's picker
// with grid, spectrum, sliders and the eyedropper. Colors are kept opaque ("#RRGGBB").
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
