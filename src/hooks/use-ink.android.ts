import { useMaterialColors } from "@expo/ui/jetpack-compose";

import type { Ink } from "@/hooks/use-ink";

// Android: the Material You colors of the device, so the text matches the Compose controls.
export function useInk(): Ink {
  const colors = useMaterialColors();
  return {
    label: colors.onSurface,
    secondary: colors.onSurfaceVariant,
    danger: colors.error,
  };
}
