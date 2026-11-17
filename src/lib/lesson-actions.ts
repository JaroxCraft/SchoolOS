import { openEntry, openScreen, openSubject, SCHOOL_ROUTES } from "@/lib/routes";
import type { RowAction } from "@/lib/row-action";

// The long-press actions of a lesson, the same in the overview and on the timetable cards.
// "Stundenplan bearbeiten" opens the editor of the settings sheet (✓ "Sichern" and back), not the
// one of the first setup.
export function lessonActions(subjectId: number): RowAction[] {
  return [
    { label: "Neuer Eintrag", icon: "plus", onPress: () => openEntry({ id: "new", subjectId }) },
    { label: "Fach anzeigen", icon: "book", onPress: () => openSubject(subjectId) },
    {
      label: "Stundenplan bearbeiten",
      icon: "pencil",
      onPress: () => openScreen(SCHOOL_ROUTES.settings.timetable),
    },
  ];
}
