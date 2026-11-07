import type { RowSymbol } from "@/components/row-icon";

// Icons of the setup screens, shared by the settings and the setup steps of the overview.
export const SETUP_STEP_ICONS = {
  periods: { sf: "clock", md: "schedule", color: "#FF9500" },
  subjects: { sf: "books.vertical", md: "menu_book", color: "#007AFF" },
  timetable: { sf: "calendar", md: "calendar_view_week", color: "#FF3B30" },
  teachers: { sf: "person.2", md: "group", color: "#34C759" },
} as const satisfies Record<string, RowSymbol>;
