import { useMaterialColors } from "@expo/ui/jetpack-compose";

import type { Ink } from "@/hooks/use-ink";

export function useInk(): Ink {
  const colors = useMaterialColors();
  return {
    label: colors.onSurface,
    secondary: colors.onSurfaceVariant,
    tertiary: colors.outline,
    danger: colors.error,
    accent: colors.primary,
  };
}
