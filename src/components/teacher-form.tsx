import { FieldGroup } from "@expo/ui";
import { router, Stack } from "expo-router";
import { useState } from "react";

import { DestructiveButton } from "@/components/destructive-button";
import { DiscardGuardHeader } from "@/components/discard-guard-header";
import { FormList } from "@/components/form-list";
import { TextField } from "@/components/text-field";
import { saveTeacher } from "@/db/actions";
import type { Teacher } from "@/db/schema";
import { useDiscardGuard } from "@/hooks/use-discard-guard";
import { confirmDelete, teacherDeletion } from "@/lib/confirm-delete";
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
  const dirty =
    name !== (teacher?.name ?? "") ||
    abbreviation !== (teacher?.abbreviation ?? "") ||
    email !== (teacher?.email ?? "");
  const allowLeave = useDiscardGuard(dirty);

  const save = async () => {
    await saveTeacher(teacher?.id ?? null, {
      name: name.trim(),
      abbreviation: abbreviation.trim(),
      email: email.trim() || null,
    });
    allowLeave();
    router.back();
  };

  const remove = () => {
    if (!teacher) return;
    confirmDelete(teacherDeletion(teacher), allowLeave);
  };

  return (
    <>
      <Stack.Title>{teacher ? teacher.name : "Neue Lehrperson"}</Stack.Title>
      <DiscardGuardHeader dirty={dirty} />
      <Stack.Toolbar placement="right">
        {saveButton && <Stack.Toolbar.Button {...saveButton} disabled={!canSave} onPress={save} />}
      </Stack.Toolbar>

      <FormList>
        <FieldGroup.Section>
          <TextField
            placeholder="Name, z. B. Julian Riegger"
            defaultValue={name}
            autoFocus={!teacher}
            autoCapitalize="words"
            onChangeText={setName}
          />
          <TextField
            placeholder="Kürzel, z. B. JRi"
            defaultValue={abbreviation}
            autoCapitalize="none"
            maxLength={5}
            onChangeText={setAbbreviation}
          />
          <TextField
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
