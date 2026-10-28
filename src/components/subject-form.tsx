import { Button, FieldGroup, TextInput } from "@expo/ui";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

import { FormList } from "@/components/form-list";
import { SelectRow } from "@/components/select-row";
import { deleteSubject, saveSubject } from "@/db/actions";
import type { Subject } from "@/db/schema";
import { SUBJECT_COLORS } from "@/lib/subject-colors";

type SubjectFormProps = {
  subject: Subject | undefined;
  usedColors: string[];
};

// New subjects get the first color that is not taken yet.
function firstFreeColor(usedColors: string[]): string {
  return (SUBJECT_COLORS.find((option) => !usedColors.includes(option.value)) ?? SUBJECT_COLORS[0])
    .value;
}

export function SubjectForm({ subject, usedColors }: SubjectFormProps) {
  const [name, setName] = useState(subject?.name ?? "");
  const [abbreviation, setAbbreviation] = useState(subject?.abbreviation ?? "");
  const [teacher, setTeacher] = useState(subject?.teacher ?? "");
  const [color, setColor] = useState(() => subject?.color ?? firstFreeColor(usedColors));

  const canSave = name.trim().length > 0;

  const save = async () => {
    const trimmedName = name.trim();
    await saveSubject(subject?.id ?? null, {
      name: trimmedName,
      abbreviation: abbreviation.trim() || trimmedName.slice(0, 3),
      color,
      teacher: teacher.trim() || null,
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
        <Stack.Toolbar.Button variant="done" disabled={!canSave} onPress={save}>
          Sichern
        </Stack.Toolbar.Button>
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
          <TextInput
            placeholder="Lehrperson (optional)"
            defaultValue={teacher}
            autoCapitalize="words"
            onChangeText={setTeacher}
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
