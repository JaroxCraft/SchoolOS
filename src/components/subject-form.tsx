import { Button, FieldGroup, TextInput } from "@expo/ui";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

import { FormList } from "@/components/form-list";
import { SelectRow } from "@/components/select-row";
import { deleteSubject, saveSubject } from "@/db/actions";
import type { Subject, Teacher } from "@/db/schema";
import { SUBJECT_COLORS } from "@/lib/subject-colors";
import { useHeaderButton } from "@/hooks/use-header-button";

type SubjectFormProps = {
  subject: Subject | undefined;
  usedColors: string[];
  teachers: Teacher[];
};

const NO_TEACHER = 0;

// New subjects get the first color that is not taken yet.
function firstFreeColor(usedColors: string[]): string {
  return (SUBJECT_COLORS.find((option) => !usedColors.includes(option.value)) ?? SUBJECT_COLORS[0])
    .value;
}

export function SubjectForm({ subject, usedColors, teachers }: SubjectFormProps) {
  const [name, setName] = useState(subject?.name ?? "");
  const [abbreviation, setAbbreviation] = useState(subject?.abbreviation ?? "");
  const [teacherId, setTeacherId] = useState(subject?.teacherId ?? NO_TEACHER);
  const [color, setColor] = useState(() => subject?.color ?? firstFreeColor(usedColors));

  const canSave = name.trim().length > 0;

  const saveButton = useHeaderButton("Sichern", "check");

  const save = async () => {
    const trimmedName = name.trim();
    await saveSubject(subject?.id ?? null, {
      name: trimmedName,
      abbreviation: abbreviation.trim() || trimmedName.slice(0, 3),
      color,
      teacherId: teacherId === NO_TEACHER ? null : teacherId,
    });
    router.back();
  };

  const remove = () => {
    if (!subject) return;
    Alert.alert(
      `${subject.name} löschen?`,
      "Die Lektionen und Noten des Fachs werden gelöscht. Hausaufgaben und Termine bleiben und erscheinen unter «Allgemein».",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: async () => {
            router.back();
            await deleteSubject(subject.id);
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Title>{subject ? subject.name : "Neues Fach"}</Stack.Title>
      <Stack.Toolbar placement="right">
        {saveButton && <Stack.Toolbar.Button {...saveButton} disabled={!canSave} onPress={save} />}
      </Stack.Toolbar>

      <FormList>
        <FieldGroup.Section>
          <TextInput
            placeholder="Name, z. B. Mathematik"
            defaultValue={name}
            autoFocus={!subject}
            onChangeText={setName}
          />
          <TextInput
            placeholder="Kürzel, z. B. M"
            defaultValue={abbreviation}
            autoCapitalize="characters"
            maxLength={5}
            onChangeText={setAbbreviation}
          />
          <SelectRow
            label="Lehrperson"
            value={teacherId}
            onChange={setTeacherId}
            options={[
              { label: "Keine", value: NO_TEACHER },
              ...teachers.map((teacher) => ({ label: teacher.name, value: teacher.id })),
            ]}
          />
          <SelectRow
            label="Farbe"
            value={color}
            onChange={setColor}
            options={SUBJECT_COLORS.map((option) => ({ label: option.name, value: option.value }))}
          />
        </FieldGroup.Section>

        {subject && (
          <FieldGroup.Section>
            <Button variant="text" label="Fach löschen" onPress={remove} />
          </FieldGroup.Section>
        )}
      </FormList>
    </>
  );
}
