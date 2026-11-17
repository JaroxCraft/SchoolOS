import { FieldGroup, ListItem, Text } from "@expo/ui";
import { Stack } from "expo-router";
import { useState } from "react";

import { Platform } from "react-native";

import { ColorField } from "@/components/color-field";
import { DiscardGuard } from "@/components/discard-guard";
import { FooterText, FormList } from "@/components/form-list";
import { DestructiveRow } from "@/components/rows";
import { NO_TEACHER, TeacherPickerSheet } from "@/components/teacher-picker";
import { TextField } from "@/components/text-field";
import { saveSubject } from "@/db/actions";
import type { Subject, Teacher } from "@/db/schema";
import { useClosingForm } from "@/hooks/use-closing-form";
import { useInk } from "@/hooks/use-ink";
import { subjectDeletion } from "@/lib/confirm-delete";
import { SUBJECT_COLORS } from "@/lib/subject-colors";
import { useSaveButton } from "@/hooks/use-header-button";

type SubjectFormProps = {
  subject: Subject | undefined;
  // Colors of all subjects, for picking a free one for a new subject
  allColors: string[];
  // Colors of the other subjects (by id), for the "used" dots of the swatches
  usedColors: string[];
  teachers: Teacher[];
};

// New subjects get the first color that is not taken yet.
function firstFreeColor(usedColors: string[]): string {
  return (SUBJECT_COLORS.find((option) => !usedColors.includes(option.value)) ?? SUBJECT_COLORS[0])
    .value;
}

// The abbreviation used when the field is left empty
const defaultAbbreviation = (name: string) => name.trim().slice(0, 3).trim();

export function SubjectForm({ subject, allColors, usedColors, teachers }: SubjectFormProps) {
  const [name, setName] = useState(subject?.name ?? "");
  const [abbreviation, setAbbreviation] = useState(subject?.abbreviation ?? "");
  const [teacherId, setTeacherId] = useState(subject?.teacherId ?? NO_TEACHER);
  const [color, setColor] = useState(() => subject?.color ?? firstFreeColor(allColors));

  const [teacherPickerOpen, setTeacherPickerOpen] = useState(false);
  const ink = useInk();

  const canSave = name.trim().length > 0;
  const saveButton = useSaveButton();
  // A new subject only counts as changed once something is typed or picked, not for its color
  const dirty =
    name !== (subject?.name ?? "") ||
    abbreviation !== (subject?.abbreviation ?? "") ||
    teacherId !== (subject?.teacherId ?? NO_TEACHER) ||
    (subject !== undefined && color !== subject.color);
  const { saving, saveAndClose, deleteAndClose } = useClosingForm(dirty);

  const save = () =>
    saveAndClose(() => {
      const trimmedName = name.trim();
      return saveSubject(subject?.id ?? null, {
        name: trimmedName,
        abbreviation: abbreviation.trim() || defaultAbbreviation(trimmedName),
        color,
        teacherId: teacherId === NO_TEACHER ? null : teacherId,
      });
    });

  const remove = () => {
    if (!subject) return;
    deleteAndClose(subjectDeletion(subject));
  };

  return (
    <>
      <Stack.Title>{subject ? subject.name : "Neues Fach"}</Stack.Title>
      <Stack.Toolbar placement="right">
        {saveButton && (
          <Stack.Toolbar.Button {...saveButton} disabled={!canSave || saving} onPress={save} />
        )}
      </Stack.Toolbar>

      <DiscardGuard dirty={dirty}>
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
            <ColorField value={color} onChange={setColor} usedColors={usedColors} />
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

          <FieldGroup.Section>
            <ListItem
              onPress={() => setTeacherPickerOpen(true)}
              trailing={
                <Text textStyle={{ color: ink.secondary }}>
                  {teachers.find((teacher) => teacher.id === teacherId)?.name ?? "Keine"}
                </Text>
              }>
              Lehrperson
            </ListItem>
          </FieldGroup.Section>

          {subject && (
            <FieldGroup.Section>
              <DestructiveRow label="Fach löschen" onPress={remove} />
            </FieldGroup.Section>
          )}
        </FormList>
      </DiscardGuard>

      {/* Outside the form: inside it, the sheet would take up an empty row */}
      <TeacherPickerSheet
        isPresented={teacherPickerOpen}
        onDismiss={() => setTeacherPickerOpen(false)}
        teachers={teachers}
        value={teacherId}
        onChange={setTeacherId}
      />
    </>
  );
}
