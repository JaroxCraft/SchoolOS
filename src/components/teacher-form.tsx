import { FieldGroup, TextInput } from "@expo/ui";
import { router, Stack } from "expo-router";
import { useState } from "react";

import { DestructiveButton } from "@/components/destructive-button";
import { FormList } from "@/components/form-list";
import { deleteTeacher, saveTeacher } from "@/db/actions";
import type { Teacher } from "@/db/schema";
import { confirmDelete } from "@/lib/confirm-delete";
import { useSaveButton } from "@/hooks/use-save-button";

type TeacherFormProps = {
  teacher: Teacher | undefined;
};

export function TeacherForm({ teacher }: TeacherFormProps) {
  const [name, setName] = useState(teacher?.name ?? "");
  const [abbreviation, setAbbreviation] = useState(teacher?.abbreviation ?? "");
  const [email, setEmail] = useState(teacher?.email ?? "");

  const canSave = name.trim().length > 0;
  const saveButton = useSaveButton();

  const save = async () => {
    await saveTeacher(teacher?.id ?? null, {
      name: name.trim(),
      abbreviation: abbreviation.trim(),
      email: email.trim() || null,
    });
    router.back();
  };

  const remove = () => {
    if (!teacher) return;
    confirmDelete(
      `${teacher.name} löschen?`,
      "Die Fächer dieser Lehrperson bleiben bestehen, aber ohne Lehrperson.",
      () => deleteTeacher(teacher.id)
    );
  };

  return (
    <>
      <Stack.Title>{teacher ? teacher.name : "Neue Lehrperson"}</Stack.Title>
      <Stack.Toolbar placement="right">
        {saveButton && <Stack.Toolbar.Button {...saveButton} disabled={!canSave} onPress={save} />}
      </Stack.Toolbar>

      <FormList>
        <FieldGroup.Section>
          <TextInput
            placeholder="Name, z. B. Julian Riegger"
            defaultValue={name}
            autoFocus={!teacher}
            autoCapitalize="words"
            onChangeText={setName}
          />
          <TextInput
            placeholder="Kürzel, z. B. JRi"
            defaultValue={abbreviation}
            autoCapitalize="none"
            maxLength={5}
            onChangeText={setAbbreviation}
          />
          <TextInput
            placeholder="E-Mail (optional)"
            defaultValue={email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setEmail}
          />
        </FieldGroup.Section>

        {teacher && (
          <FieldGroup.Section>
            <DestructiveButton label="Lehrperson löschen" onPress={remove} />
          </FieldGroup.Section>
        )}
      </FormList>
    </>
  );
}
