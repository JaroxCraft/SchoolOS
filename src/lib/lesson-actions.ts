import { t } from "@/i18n";
import { openEntry, openScreen, openSubject, SCHOOL_ROUTES } from "@/lib/routes";
import type { RowAction } from "@/lib/row-action";

// The long-press actions of a lesson, the same in the overview and on the timetable cards.
// "Edit timetable" opens the editor of the settings sheet (✓ "Save" and back), not the
// one of the first setup.
export function lessonActions(subjectId: number): RowAction[] {
  return [
    {
      label: t.entries.newEntry,
      icon: "plus",
      onPress: () => openEntry({ id: "new", subjectId }),
    },
    {
      label: t.school.lessonActions.showSubject,
      icon: "book",
      onPress: () => openSubject(subjectId),
    },
    {
      label: t.school.lessonActions.editTimetable,
      icon: "pencil",
      onPress: () => openScreen(SCHOOL_ROUTES.settings.timetable),
    },
  ];
}
