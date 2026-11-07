import { FieldGroup } from "@expo/ui";
import { router, Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";

import { Platform } from "react-native";

import { ColorField } from "@/components/color-field";
import { DestructiveButton } from "@/components/destructive-button";
import { FooterText, FormList } from "@/components/form-list";
import { ActionRow } from "@/components/rows";
import { SelectRow } from "@/components/select-row";
import { TextField } from "@/components/text-field";
import { deleteSubject, saveSubject } from "@/db/actions";
import type { Subject, Teacher } from "@/db/schema";
import { confirmDelete } from "@/lib/confirm-delete";
import { SUBJECT_COLORS } from "@/lib/subject-colors";
import { useSaveButton } from "@/hooks/use-save-button";

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

// The abbreviation used when the field is left empty
const defaultAbbreviation = (name: string) => name.trim().slice(0, 3);

export function SubjectForm({ subject, usedColors, teachers }: SubjectFormProps) {
  const [name, setName] = useState(subject?.name ?? "");
  const [abbreviation, setAbbreviation] = useState(subject?.abbreviation ?? "");
  const [teacherId, setTeacherId] = useState(subject?.teacherId ?? NO_TEACHER);
  const [color, setColor] = useState(() => subject?.color ?? firstFreeColor(usedColors));

  // A teacher created from here ("Neue Lehrperson") is selected when coming back
  const knownTeachers = useRef(new Set(teachers.map((teacher) => teacher.id)));
  useEffect(() => {
    const added = teachers.filter((teacher) => !knownTeachers.current.has(teacher.id));
    knownTeachers.current = new Set(teachers.map((teacher) => teacher.id));
    if (added.length === 1) setTeacherId(added[0].id);
  }, [teachers]);

  const canSave = name.trim().length > 0;
  const saveButton = useSaveButton();

  const save = async () => {
    const trimmedName = name.trim();
    await saveSubject(subject?.id ?? null, {
      name: trimmedName,
      abbreviation: abbreviation.trim() || defaultAbbreviation(trimmedName),
      color,
      teacherId: teacherId === NO_TEACHER ? null : teacherId,
    });
    router.back();
  };

  const remove = () => {
    if (!subject) return;
    confirmDelete(
      `${subject.name} löschen?`,
      "Die Lektionen und Noten des Fachs werden gelöscht. Hausaufgaben und Termine bleiben und erscheinen unter «Allgemein».",
      () => deleteSubject(subject.id)
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
          <TextField
            placeholder="Name, z. B. Mathematik"
            defaultValue={name}
            autoFocus={!subject}
            autoCapitalize="words"
            onChangeText={setName}
          />
          <TextField
            placeholder={
              name.trim() ? `Kürzel (sonst «${defaultAbbreviation(name)}»)` : "Kürzel, z. B. M"
            }
            defaultValue={abbreviation}
            autoCapitalize="characters"
            maxLength={5}
            onChangeText={setAbbreviation}
          />
          <FieldGroup.SectionFooter>
            <FooterText>Das Kürzel erscheint im Stundenplan.</FooterText>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        {/* iOS: a row with the system color picker; Android: the color swatches */}
        <FieldGroup.Section title={Platform.OS === "android" ? "Farbe" : undefined}>
          <ColorField
            value={color}
            onChange={setColor}
            usedColors={usedColors.filter((used) => used !== subject?.color)}
          />
          {Platform.OS === "android" ? (
            <FieldGroup.SectionFooter>
              <FooterText>Ein Punkt markiert Farben, die schon ein anderes Fach hat.</FooterText>
            </FieldGroup.SectionFooter>
          ) : (
            <FieldGroup.SectionFooter>
              <FooterText>Die Farbe erscheint im Stundenplan und bei den Einträgen.</FooterText>
            </FieldGroup.SectionFooter>
          )}
        </FieldGroup.Section>

        <FieldGroup.Section title="Lehrperson">
          <SelectRow
            label="Lehrperson"
            value={teacherId}
            onChange={setTeacherId}
            options={[
              { label: "Keine", value: NO_TEACHER },
              ...teachers.map((teacher) => ({ label: teacher.name, value: teacher.id })),
            ]}
          />
          <ActionRow
            label="Neue Lehrperson"
            onPress={() =>
              router.push({ pathname: "/settings/teacher/[id]", params: { id: "new" } })
            }
          />
        </FieldGroup.Section>

        {subject && (
          <FieldGroup.Section>
            <DestructiveButton label="Fach löschen" onPress={remove} />
          </FieldGroup.Section>
        )}
      </FormList>
    </>
  );
}
