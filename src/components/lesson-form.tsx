import { FieldGroup, TextInput } from "@expo/ui";
import { router, Stack } from "expo-router";
import { useState } from "react";

import { FormList } from "@/components/form-list";
import { SelectRow } from "@/components/select-row";
import { setLesson } from "@/db/actions";
import type { Lesson, Subject } from "@/db/schema";
import { weekdayName } from "@/lib/dates";
import { useHeaderButton } from "@/hooks/use-header-button";

const FREE = 0;

type LessonFormProps = {
  weekday: number;
  periodId: number;
  periodNumber: number;
  lesson: Lesson | undefined;
  subjects: Subject[];
};

export function LessonForm({ weekday, periodId, periodNumber, lesson, subjects }: LessonFormProps) {
  const [subjectId, setSubjectId] = useState(lesson?.subjectId ?? FREE);
  const [room, setRoom] = useState(lesson?.room ?? "");

  const saveButton = useHeaderButton("Sichern", "check");

  const save = async () => {
    await setLesson(weekday, periodId, subjectId === FREE ? null : subjectId, room.trim() || null);
    router.back();
  };

  return (
    <>
      <Stack.Title>{`${weekdayName(weekday)}, ${periodNumber}. Lektion`}</Stack.Title>
      <Stack.Toolbar placement="right">
        {saveButton && <Stack.Toolbar.Button {...saveButton} onPress={save} />}
      </Stack.Toolbar>

      <FormList>
        <FieldGroup.Section>
          <SelectRow
            label="Fach"
            value={subjectId}
            onChange={setSubjectId}
            options={[
              { label: "Frei", value: FREE },
              ...subjects.map((subject) => ({ label: subject.name, value: subject.id })),
            ]}
          />
          {subjectId !== FREE && (
            <TextInput placeholder="Zimmer (optional)" defaultValue={room} onChangeText={setRoom} />
          )}
        </FieldGroup.Section>
      </FormList>
    </>
  );
}
