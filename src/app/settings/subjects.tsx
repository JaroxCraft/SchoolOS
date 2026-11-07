import { FieldGroup } from "@expo/ui";
import { router, Stack } from "expo-router";

import { FormList } from "@/components/form-list";
import { ActionRow, NavigationRow } from "@/components/rows";
import { SubjectDot } from "@/components/subject-dot";
import { useSubjects, useTeachers } from "@/db/queries";
import { joinDetails } from "@/lib/text";

const openSubject = (id: string) =>
  router.push({ pathname: "/settings/subject/[id]", params: { id } });

export default function SubjectsScreen() {
  const subjects = useSubjects();
  const teachers = useTeachers();

  return (
    <>
      <Stack.Title>Fächer</Stack.Title>
      <FormList>
        <FieldGroup.Section>
          {subjects.map((subject) => (
            <NavigationRow
              key={subject.id}
              onPress={() => openSubject(String(subject.id))}
              leading={<SubjectDot color={subject.color} />}
              supportingText={joinDetails(
                subject.abbreviation,
                teachers.find((teacher) => teacher.id === subject.teacherId)?.name
              )}>
              {subject.name}
            </NavigationRow>
          ))}
          <ActionRow label="Fach hinzufügen" onPress={() => openSubject("new")} />
        </FieldGroup.Section>

        {subjects.length > 0 && (
          <FieldGroup.Section>
            <ActionRow
              label="Weiter zum Stundenplan"
              onPress={() => router.push("/settings/timetable")}
            />
          </FieldGroup.Section>
        )}
      </FormList>
    </>
  );
}
