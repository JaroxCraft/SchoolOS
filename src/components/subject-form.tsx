import { FieldGroup } from "@expo/ui";
import { useState } from "react";
import { Platform } from "react-native";

import { ColorField } from "@/components/color-field";
import { FooterText } from "@/components/form-list";
import { AbbreviationField, abbreviationToSave, canSaveNamed } from "@/components/name-fields";
import { PushedForm } from "@/components/pushed-form";
import { DestructiveRow } from "@/components/rows";
import { NONE, noneToNull } from "@/components/search-picker";
import { useTeacherPicker } from "@/components/teacher-picker";
import { TextField } from "@/components/text-field";
import { saveSubject } from "@/db/actions";
import type { Subject, Teacher } from "@/db/schema";
import { useClosingForm } from "@/hooks/use-closing-form";
import { subjectDeletion } from "@/lib/confirm-delete";
import { SUBJECT_COLORS } from "@/lib/subject-colors";
import { subjectAbbreviation } from "@/lib/text";

type SubjectFormProps = {
  subject: Subject | undefined;
  usedColors: string[];
  teachers: Teacher[];
};

function firstFreeColor(usedColors: string[]): string {
  return (SUBJECT_COLORS.find((option) => !usedColors.includes(option.value)) ?? SUBJECT_COLORS[0])
    .value;
}

export function SubjectForm({ subject, usedColors, teachers }: SubjectFormProps) {
  const [name, setName] = useState(subject?.name ?? "");
  const [abbreviation, setAbbreviation] = useState(subject?.abbreviation ?? "");
  const [teacherId, setTeacherId] = useState(subject?.teacherId ?? NONE);
  const [color, setColor] = useState(() => subject?.color ?? firstFreeColor(usedColors));
  const teacherPicker = useTeacherPicker({
    label: "Lehrperson",
    teachers,
    value: teacherId,
    onChange: setTeacherId,
  });

  // A new subject's color alone does not count as a change
  const colorChanged = subject !== undefined && color !== subject.color;
  const dirty =
    name !== (subject?.name ?? "") ||
    abbreviation !== (subject?.abbreviation ?? "") ||
    teacherId !== (subject?.teacherId ?? NONE) ||
    colorChanged;
  const { saving, saveAndClose, deleteAndClose } = useClosingForm(dirty);

  const save = () =>
    saveAndClose(() =>
      saveSubject(subject?.id ?? null, {
        name: name.trim(),
        abbreviation: abbreviationToSave(abbreviation, name, subjectAbbreviation),
        color,
        teacherId: noneToNull(teacherId),
      })
    );

  const remove = () => {
    if (!subject) return;
    deleteAndClose(subjectDeletion(subject));
  };

  return (
    <>
      <PushedForm
        title={subject ? subject.name : "Neues Fach"}
        canSave={canSaveNamed(dirty, name) && !saving}
        dirty={dirty}
        onSave={save}>
        <FieldGroup.Section>
          <TextField
            placeholder="Name, z. B. Mathematik"
            defaultValue={name}
            autoFocus={!subject}
            autoCapitalize="words"
            onChangeText={setName}
          />
          <AbbreviationField
            name={name}
            makeAbbreviation={subjectAbbreviation}
            example="Kürzel, z. B. M"
            defaultValue={abbreviation}
            autoCapitalize="characters"
            onChangeText={setAbbreviation}
          />
          <FieldGroup.SectionFooter>
            <FooterText>Das Kürzel erscheint im Stundenplan.</FooterText>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section title={Platform.OS === "android" ? "Farbe" : undefined}>
          <ColorField value={color} onChange={setColor} usedColors={usedColors} />
          <FieldGroup.SectionFooter>
            <FooterText>
              {Platform.OS === "android"
                ? "Die Farbe erscheint im Stundenplan und bei den Einträgen. Ein Punkt markiert Farben, die schon ein anderes Fach hat."
                : "Die Farbe erscheint im Stundenplan und bei den Einträgen."}
            </FooterText>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section>{teacherPicker.row}</FieldGroup.Section>

        {subject && (
          <FieldGroup.Section>
            <DestructiveRow label="Fach löschen" onPress={remove} />
          </FieldGroup.Section>
        )}
      </PushedForm>

      {/* Outside the form: inside it, the sheet would take up an empty row */}
      {teacherPicker.sheet}
    </>
  );
}
