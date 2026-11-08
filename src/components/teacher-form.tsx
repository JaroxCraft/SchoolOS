import { FieldGroup } from "@expo/ui";
import { router, Stack } from "expo-router";
import { useState } from "react";

import { DiscardGuard } from "@/components/discard-guard";
import { FormList } from "@/components/form-list";
import { DestructiveRow } from "@/components/rows";
import { TextField } from "@/components/text-field";
import { saveTeacher } from "@/db/actions";
import type { Teacher } from "@/db/schema";
import { useDiscardGuard } from "@/hooks/use-discard-guard";
import { confirmDelete, teacherDeletion } from "@/lib/confirm-delete";
import { useSaveButton } from "@/hooks/use-header-button";
import { useSaving } from "@/hooks/use-saving";

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

  const { saving, run } = useSaving({ closesOnSuccess: true });
  const save = () =>
    run(async () => {
      await saveTeacher(teacher?.id ?? null, {
        name: name.trim(),
        abbreviation: abbreviation.trim(),
        email: email.trim() || null,
      });
      allowLeave();
      router.back();
    });

  const remove = () => {
    if (!teacher) return;
    confirmDelete(teacherDeletion(teacher), allowLeave);
  };

  return (
    <>
      <Stack.Title>{teacher ? teacher.name : "Neue Lehrperson"}</Stack.Title>
      <Stack.Toolbar placement="right">
        {saveButton && (
          <Stack.Toolbar.Button {...saveButton} disabled={!canSave || saving} onPress={save} />
        )}
      </Stack.Toolbar>

      <DiscardGuard dirty={dirty}>
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
              <DestructiveRow label="Lehrperson löschen" onPress={remove} />
            </FieldGroup.Section>
          )}
        </FormList>
      </DiscardGuard>
    </>
  );
}
