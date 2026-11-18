import { t } from "@/i18n";
import { SYSTEM_COLORS } from "@/lib/system-colors";

const { colors } = t.school;

export const SUBJECT_COLORS = [
  { name: colors.red, value: SYSTEM_COLORS.red },
  { name: colors.orange, value: SYSTEM_COLORS.orange },
  { name: colors.yellow, value: SYSTEM_COLORS.yellow },
  { name: colors.green, value: SYSTEM_COLORS.green },
  { name: colors.mint, value: SYSTEM_COLORS.mint },
  { name: colors.blue, value: SYSTEM_COLORS.blue },
  { name: colors.indigo, value: SYSTEM_COLORS.indigo },
  { name: colors.purple, value: SYSTEM_COLORS.purple },
  { name: colors.pink, value: SYSTEM_COLORS.pink },
  { name: colors.brown, value: SYSTEM_COLORS.brown },
] as const;

export const NO_SUBJECT_COLOR = SYSTEM_COLORS.gray;
