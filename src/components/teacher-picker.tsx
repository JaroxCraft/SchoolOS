import { SearchPickerSheet } from "@/components/search-picker-sheet";
import { useTeacherDraft } from "@/components/teacher-draft";
import type { Teacher } from "@/db/schema";

export const NO_TEACHER = 0;

type TeacherPickerSheetProps = {
  isPresented: boolean;
  onDismiss: () => void;
  teachers: Teacher[];
  value: number;
  onChange: (value: number) => void;
};

// The teachers by name, searchable by name or abbreviation, with "Keine" on top. A missing
// teacher is added right in the sheet ("Neue Lehrperson") and picked at once; a teacher is
// changed right in the sheet too ("Bearbeiten" in the row actions).
export function TeacherPickerSheet({ teachers, ...props }: TeacherPickerSheetProps) {
  const draft = useTeacherDraft();

  return (
    <SearchPickerSheet
      {...props}
      title="Lehrperson"
      searchPlaceholder="Name oder Kürzel"
      items={[...teachers].sort((a, b) => a.name.localeCompare(b.name))}
      itemsTitle="Lehrpersonen"
      getLabel={(teacher) => teacher.name}
      getSearchText={(teacher) => [teacher.name, teacher.abbreviation]}
      getSupportingText={(teacher) => teacher.abbreviation || undefined}
      extraChoices={[{ label: "Keine", value: NO_TEACHER }]}
      form={{
        label: "Neue Lehrperson",
        editLabel: "Lehrperson bearbeiten",
        canSave: draft.canSave,
        start: draft.start,
        save: draft.save,
        fields: draft.fields,
      }}
    />
  );
}
