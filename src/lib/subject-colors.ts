import { SYSTEM_COLORS } from "@/lib/system-colors";

export const SUBJECT_COLORS = [
  { name: "Rot", value: SYSTEM_COLORS.red },
  { name: "Orange", value: SYSTEM_COLORS.orange },
  { name: "Gelb", value: SYSTEM_COLORS.yellow },
  { name: "Grün", value: SYSTEM_COLORS.green },
  { name: "Mint", value: SYSTEM_COLORS.mint },
  { name: "Blau", value: SYSTEM_COLORS.blue },
  { name: "Indigo", value: SYSTEM_COLORS.indigo },
  { name: "Violett", value: SYSTEM_COLORS.purple },
  { name: "Pink", value: SYSTEM_COLORS.pink },
  { name: "Braun", value: SYSTEM_COLORS.brown },
] as const;

// Entries without a subject ("Allgemein")
export const NEUTRAL_COLOR = SYSTEM_COLORS.gray;
