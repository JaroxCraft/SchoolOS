import { ListItem, Text } from "@expo/ui";
import { useState } from "react";

import { type ExtraChoice, NONE } from "@/components/search-picker";
import { SearchPickerSheet } from "@/components/search-picker-sheet";
import { useTeacherDraft } from "@/components/teacher-draft";
import type { Teacher } from "@/db/schema";
import { useInk } from "@/hooks/use-ink";

// The choice for a Fach without a Lehrperson, in the sheet and in the row showing the choice
const NO_TEACHER_CHOICE: ExtraChoice = { label: "Keine", value: NONE };

type TeacherPickerSheetProps = {
  isPresented: boolean;
  onDismiss: () => void;
  title: string;
  teachers: Teacher[];
  value: number;
  onChange: (value: number) => void;
};

// The teachers by name, searchable by name or abbreviation, with "Keine" on top. A missing
// teacher is added right in the sheet ("Lehrperson hinzufügen") and picked at once; a teacher is
// changed right in the sheet too ("Bearbeiten" in the row actions).
function TeacherPickerSheet({ teachers, ...props }: TeacherPickerSheetProps) {
  const draft = useTeacherDraft();

  return (
    <SearchPickerSheet
      {...props}
      searchPlaceholder="Name oder Kürzel suchen"
      items={[...teachers].sort((a, b) => a.name.localeCompare(b.name))}
      itemsTitle="Lehrpersonen"
      getLabel={(teacher) => teacher.name}
      getSearchText={(teacher) => [teacher.name, teacher.abbreviation]}
      getSupportingText={(teacher) => teacher.abbreviation || undefined}
      extraChoices={[NO_TEACHER_CHOICE]}
      form={{
        addLabel: "Lehrperson hinzufügen",
        newTitle: "Neue Lehrperson",
        editTitle: (teacher) => teacher.name,
        canSave: draft.canSave,
        start: draft.start,
        save: draft.save,
        fields: draft.fields,
      }}
    />
  );
}

type TeacherPickerOptions = Omit<TeacherPickerSheetProps, "isPresented" | "onDismiss" | "title"> & {
  label: string;
};

// A form row showing the chosen teacher, and the sheet it opens, like useSubjectPicker. Place
// `row` in the form and `sheet` outside of it (after <FormList>): inside a SwiftUI form the sheet
// would take up an empty row of its own.
export function useTeacherPicker({ label, ...props }: TeacherPickerOptions) {
  const ink = useInk();
  const [open, setOpen] = useState(false);
  const selectedLabel =
    props.teachers.find((teacher) => teacher.id === props.value)?.name ?? NO_TEACHER_CHOICE.label;

  // A direct list item of the section: Android draws it as the row with the section background
  const row = (
    <ListItem
      onPress={() => setOpen(true)}
      trailing={<Text textStyle={{ color: ink.secondary }}>{selectedLabel}</Text>}>
      {label}
    </ListItem>
  );

  const sheet = (
    <TeacherPickerSheet
      {...props}
      title={label}
      isPresented={open}
      onDismiss={() => setOpen(false)}
    />
  );

  return { row, sheet };
}
