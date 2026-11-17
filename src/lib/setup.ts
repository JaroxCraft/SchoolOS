import type { RowSymbol } from "@/lib/row-action";
import { SYSTEM_COLORS } from "@/lib/system-colors";

export const SETUP_STEP_ICONS = {
  periods: { sf: "clock", md: "schedule", color: SYSTEM_COLORS.orange },
  subjects: { sf: "books.vertical", md: "menu_book", color: SYSTEM_COLORS.blue },
  timetable: { sf: "calendar", md: "calendar_view_week", color: SYSTEM_COLORS.red },
  teachers: { sf: "person.2", md: "group", color: SYSTEM_COLORS.green },
} as const satisfies Record<string, RowSymbol>;
