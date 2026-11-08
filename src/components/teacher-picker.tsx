import { useState } from "react";

import { SearchPickerSheet } from "@/components/search-picker-sheet";
import { TextField } from "@/components/text-field";
import { addTeacher, saveTeacher } from "@/db/actions";
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
  // The teacher the form changes; null for a new one
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [email, setEmail] = useState("");
  // Remounts the fields each time the form opens, so they show the values above
  const [draft, setDraft] = useState(0);

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
        canSave: name.trim().length > 0,
        start: (teacher) => {
          setEditingId(teacher?.id ?? null);
          setName(teacher?.name ?? "");
          setAbbreviation(teacher?.abbreviation ?? "");
          setEmail(teacher?.email ?? "");
          setDraft((count) => count + 1);
        },
        save: async () => {
          const values = {
            name: name.trim(),
            abbreviation: abbreviation.trim(),
            email: email.trim() || null,
          };
          if (editingId === null) return addTeacher(values);
          await saveTeacher(editingId, values);
          return editingId;
        },
        fields: [
          <TextField
            key={`name-${draft}`}
            placeholder="Name, z. B. Julian Riegger"
            defaultValue={name}
            // A new teacher starts with the name; a change starts where the user taps
            autoFocus={editingId === null}
            autoCapitalize="words"
            onChangeText={setName}
          />,
          <TextField
            key={`abbreviation-${draft}`}
            placeholder="Kürzel, z. B. JRi"
            defaultValue={abbreviation}
            autoCapitalize="none"
            maxLength={5}
            onChangeText={setAbbreviation}
          />,
          <TextField
            key={`email-${draft}`}
            placeholder="E-Mail (optional)"
            defaultValue={email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setEmail}
          />,
        ],
      }}
    />
  );
}
