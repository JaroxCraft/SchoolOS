import { Button, FieldGroup, TextInput } from "@expo/ui";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

import { FormList } from "@/components/form-list";
import { deleteTeacher, saveTeacher } from "@/db/actions";
import type { Teacher } from "@/db/schema";
import { useHeaderButton } from "@/hooks/use-header-button";

type TeacherFormProps = {
  teacher: Teacher | undefined;
};

export function TeacherForm({ teacher }: TeacherFormProps) {
  const [name, setName] = useState(teacher?.name ?? "");
  const [abbreviation, setAbbreviation] = useState(teacher?.abbreviation ?? "");
  const [email, setEmail] = useState(teacher?.email ?? "");

  const canSave = name.trim().length > 0;
  const saveButton = useHeaderButton("Sichern", "check");

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
    Alert.alert(
      `${teacher.name} löschen?`,
      "Die Fächer dieser Lehrperson bleiben bestehen, aber ohne Lehrperson.",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: async () => {
            router.back();
            await deleteTeacher(teacher.id);
          },
        },
      ]
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
            <Button variant="text" label="Lehrperson löschen" onPress={remove} />
          </FieldGroup.Section>
        )}
      </FormList>
    </>
  );
}
