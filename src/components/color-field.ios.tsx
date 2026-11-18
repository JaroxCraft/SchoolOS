import { ColorPicker } from "@expo/ui/swift-ui";

import type { ColorFieldProps } from "@/components/color-field";
import { t } from "@/i18n";

export function ColorField({ value, onChange }: ColorFieldProps) {
  return (
    <ColorPicker
      label={t.school.subjectForm.color}
      selection={value}
      supportsOpacity={false}
      onSelectionChange={(color) => color && onChange(color.slice(0, 7).toUpperCase())}
    />
  );
}
