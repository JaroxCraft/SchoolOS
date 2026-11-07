import { useState } from "react";

import { SearchPickerSheet } from "@/components/search-picker-sheet";
import { TextField } from "@/components/text-field";
import { addTeacher } from "@/db/actions";
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
// teacher is added right in the sheet ("Neue Lehrperson") and picked at once.
export function TeacherPickerSheet({ onDismiss, teachers, ...props }: TeacherPickerSheetProps) {
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [email, setEmail] = useState("");

  const dismiss = () => {
    setName("");
    setAbbreviation("");
    setEmail("");
    onDismiss();
  };

  return (
    <SearchPickerSheet
      {...props}
      onDismiss={dismiss}
      title="Lehrperson"
      searchPlaceholder="Name oder Kürzel"
      items={[...teachers].sort((a, b) => a.name.localeCompare(b.name))}
      itemsTitle="Lehrpersonen"
      getLabel={(teacher) => teacher.name}
      getSearchText={(teacher) => [teacher.name, teacher.abbreviation]}
      getSupportingText={(teacher) => teacher.abbreviation || undefined}
      extraChoices={[{ label: "Keine", value: NO_TEACHER }]}
      create={{
        label: "Neue Lehrperson",
        canSave: name.trim().length > 0,
        save: () =>
          addTeacher({
            name: name.trim(),
            abbreviation: abbreviation.trim(),
            email: email.trim() || null,
          }),
        fields: [
          <TextField
            key="name"
            placeholder="Name, z. B. Julian Riegger"
            autoFocus
            autoCapitalize="words"
            onChangeText={setName}
          />,
          <TextField
            key="abbreviation"
            placeholder="Kürzel, z. B. JRi"
            autoCapitalize="none"
            maxLength={5}
            onChangeText={setAbbreviation}
          />,
          <TextField
            key="email"
            placeholder="E-Mail (optional)"
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
